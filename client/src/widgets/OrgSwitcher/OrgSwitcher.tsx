import { Button, Divider, Menu, Text } from '@mantine/core';
import { IconBuilding, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMyOrganizationsQuery } from '@/app/api/organizations.ts';
import { useMyWorkspacesQuery } from '@/app/api/workspaces.ts';
import { orgActions, currentOrgIdSelector, currentWorkspaceIdSelector } from '@/entities/organization';
import { RouterPaths } from '@/shared/router/paths.ts';
import { buildAbsolutePath } from '@/shared/utils/router';

export function OrgSwitcher() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentOrgId = useSelector(currentOrgIdSelector);
    const currentWorkspaceId = useSelector(currentWorkspaceIdSelector);

    const { data: orgs } = useMyOrganizationsQuery();
    const { data: workspaces } = useMyWorkspacesQuery({ orgId: currentOrgId ?? '' }, { skip: !currentOrgId });

    const currentOrg = orgs?.find((o) => o.id === currentOrgId);

    function switchOrg(orgId: string) {
        dispatch(orgActions.setCurrentOrg(orgId));
        navigate(buildAbsolutePath([RouterPaths.Org, orgId]));
    }

    function switchWorkspace(workspaceId: string) {
        dispatch(orgActions.setCurrentWorkspace(workspaceId));
    }

    const otherOrgs = (orgs ?? []).filter((o) => o.id !== currentOrgId);

    return (
        <Menu position="bottom-start" width={220}>
            <Menu.Target>
                <Button
                    variant="default"
                    size="sm"
                    leftSection={<IconBuilding size={14} />}
                    rightSection={<IconChevronDown size={12} />}
                >
                    {currentOrg ? currentOrg.name : 'Организация'}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                {/* Current org label */}
                {currentOrg && <Menu.Label>{currentOrg.name}</Menu.Label>}

                {/* Other orgs */}
                {otherOrgs.map((org) => (
                    <Menu.Item key={org.id} leftSection={<IconBuilding size={14} />} onClick={() => switchOrg(org.id)}>
                        {org.name}
                    </Menu.Item>
                ))}

                {/* Create org */}
                <Menu.Item
                    leftSection={<IconPlus size={14} />}
                    onClick={() => navigate(buildAbsolutePath([RouterPaths.Org, RouterPaths.OrgCreate]))}
                >
                    Создать организацию
                </Menu.Item>

                {/* Workspaces section */}
                {currentOrgId && (workspaces ?? []).length > 0 && (
                    <>
                        <Divider />
                        <Menu.Label>Рабочие пространства</Menu.Label>
                        {(workspaces ?? []).map((ws) => (
                            <Menu.Item key={ws.id} onClick={() => switchWorkspace(ws.id)}>
                                <Text size="sm" fw={ws.id === currentWorkspaceId ? 700 : 400}>
                                    {ws.name}
                                </Text>
                            </Menu.Item>
                        ))}
                    </>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
