import { diskStorage } from 'multer';

export const multerConfig = {
  storage: diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
