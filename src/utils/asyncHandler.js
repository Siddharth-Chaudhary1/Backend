// promise wala asyncHandler
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx //
// try catch ka wraper jo ki har jagah use krskte h as function

// This is asynchronous higher order(jo function ko as variable pass ya accept kre) 
// ye aise function ko lega aur excute krdega
// next middle ware h cookie wale
// const asyncHandler = (fn) => {async (req,res,next) => {
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.status(err.code||500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }}