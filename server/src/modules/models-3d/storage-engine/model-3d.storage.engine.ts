import crypto from 'crypto';
import fs from 'fs';
import os from 'node:os';
import path from 'path';
import multer from 'multer';

function getFilename(req: any, file: any, cb: any) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

function getDestination(req: any, file: any, cb: any) {
  cb(null, os.tmpdir());
}

export class Model3DDiskStorage {
  getFilename: (req: any, file: any, cb: any) => void;

  public constructor(opts: {
    filename?: (req: any, file: any, cb: any) => void;
    destination?: ((req: any, file: any, cb: any) => void) | string;
  }) {
    this.getFilename = opts.filename || getFilename;

    if (typeof opts.destination === 'string') {
      // mkdirp.sync(opts.destination);
      // this.getDestination = function ($0, $1, cb) {
      //   cb(null, opts.destination);
      // };
    } else {
      // this.getDestination = opts.destination || getDestination;
    }
  }

  public _handleFile(req: any, file: any, cb: any) {
    // const that = this;
    //
    // that.getDestination(req, file, function (err, destination) {
    //   if (err) return cb(err);
    //
    //   that.getFilename(req, file, function (err, filename) {
    //     if (err) return cb(err);
    //
    //     const finalPath = path.join(destination, filename);
    //     const outStream = fs.createWriteStream(finalPath);
    //
    //     file.stream.pipe(outStream);
    //     outStream.on('error', cb);
    //     outStream.on('finish', function () {
    //       cb(null, {
    //         destination: destination,
    //         filename: filename,
    //         path: finalPath,
    //         size: outStream.bytesWritten,
    //       });
    //     });
    //   });
    // });
  }

  public _removeFile(req: any, file: any, cb: any) {
    const path = file.path;

    delete file.destination;
    delete file.filename;
    delete file.path;

    fs.unlink(path, cb);
  }
}

export const Model3DStorageEngine = {
  provide: 'STORAGE_ENGINE',
  useFactory: () => {
    const STORAGE_DISK_PATH = 'files/';

    return multer.diskStorage({
      destination: (req, file, cb) => {
        console.log('disk storage destination', STORAGE_DISK_PATH);
        cb(null, STORAGE_DISK_PATH);
      },
      filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        // [fieldName]-[date].[ext]
        cb(null, `${file.fieldname}-${Date.now()}${extension}`);
      },
    });
  },
};
