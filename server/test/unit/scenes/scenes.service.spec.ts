import { ForbiddenException } from '@nestjs/common';
import { ScenesService } from '@/modules/scenes/services/scenes.service';

type Mocks = {
  workspaceMemberRepository: { findByWorkspaceAndUser: jest.Mock };
};

function buildService(): { service: ScenesService; mocks: Mocks } {
  const workspaceMemberRepository = { findByWorkspaceAndUser: jest.fn() };
  const noop = {} as any;

  // Only `workspaceMemberRepository` is touched by the access-check helpers under test.
  // The remaining constructor dependencies are stubbed to keep the test hermetic.
  const service = new ScenesService(
    noop, // sceneRepository
    noop, // sceneObjectRepository
    noop, // sceneLightRepository
    workspaceMemberRepository as any,
    noop, // filesService
    noop, // webhookDeliveryService
    noop, // dataSource
  );

  return { service, mocks: { workspaceMemberRepository } };
}

function makeScene(overrides: Partial<{ visibility: string; userId: string | null; workspaceId: string | null }>) {
  return {
    id: 'scene-1',
    visibility: 'private',
    userId: null,
    workspaceId: null,
    ...overrides,
  } as any;
}

describe('ScenesService — access checks', () => {
  describe('requireSceneReadAccess', () => {
    it('allows public scenes for anonymous users', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'public' });
      await expect((service as any).requireSceneReadAccess(scene, null)).resolves.toBeUndefined();
    });

    it('allows unlisted scenes for anonymous users', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'unlisted' });
      await expect((service as any).requireSceneReadAccess(scene, null)).resolves.toBeUndefined();
    });

    it('denies private scenes to anonymous users', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'private', userId: 'owner-1' });
      await expect((service as any).requireSceneReadAccess(scene, null)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the owner of a private personal scene', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'private', userId: 'owner-1' });
      await expect((service as any).requireSceneReadAccess(scene, 'owner-1')).resolves.toBeUndefined();
    });

    it('denies non-owners on a private personal scene', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'private', userId: 'owner-1' });
      await expect((service as any).requireSceneReadAccess(scene, 'someone-else')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows workspace members on a private workspace scene', async () => {
      const { service, mocks } = buildService();
      mocks.workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValue({ id: 'member-1' });
      const scene = makeScene({ visibility: 'private', workspaceId: 'ws-1' });
      await expect((service as any).requireSceneReadAccess(scene, 'user-1')).resolves.toBeUndefined();
      expect(mocks.workspaceMemberRepository.findByWorkspaceAndUser).toHaveBeenCalledWith('ws-1', 'user-1');
    });

    it('denies non-members on a private workspace scene', async () => {
      const { service, mocks } = buildService();
      mocks.workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValue(null);
      const scene = makeScene({ visibility: 'private', workspaceId: 'ws-1' });
      await expect((service as any).requireSceneReadAccess(scene, 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('requireSceneWriteAccess', () => {
    it('denies anonymous users regardless of visibility', async () => {
      const { service } = buildService();
      const scene = makeScene({ visibility: 'public', userId: 'owner-1' });
      await expect((service as any).requireSceneWriteAccess(scene, null)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the owner of a personal scene', async () => {
      const { service } = buildService();
      const scene = makeScene({ userId: 'owner-1' });
      await expect((service as any).requireSceneWriteAccess(scene, 'owner-1')).resolves.toBeUndefined();
    });

    it('denies non-owners on a personal scene', async () => {
      const { service } = buildService();
      const scene = makeScene({ userId: 'owner-1' });
      await expect((service as any).requireSceneWriteAccess(scene, 'someone-else')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows workspace members on a workspace scene', async () => {
      const { service, mocks } = buildService();
      mocks.workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValue({ id: 'member-1' });
      const scene = makeScene({ workspaceId: 'ws-1' });
      await expect((service as any).requireSceneWriteAccess(scene, 'user-1')).resolves.toBeUndefined();
    });

    it('denies non-members on a workspace scene', async () => {
      const { service, mocks } = buildService();
      mocks.workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValue(null);
      const scene = makeScene({ workspaceId: 'ws-1' });
      await expect((service as any).requireSceneWriteAccess(scene, 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
