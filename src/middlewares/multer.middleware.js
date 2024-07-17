import multer from "multer";

const storage = multer.diskStorage({
    // as express doesn't handle file so multer is used 
    // same function is given parameters req which is handled by express
    // to handle file multer is used as middleware
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    //  here file is saved by same name by which it is uploaded
    // it can be modified by add random suffix to overcome file over write
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})