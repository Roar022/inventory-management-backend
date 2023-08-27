const express = require("express");
const router = express.Router();
const { registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword
    } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
// Create a Task
//                   function
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/getuser",protect, getUser);
router.get("/loggedin", loginStatus);
router.patch("/updateuser", protect, updateUser);
router.patch("/updatepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

// Get Request / Task
// router.get("/", getTasks);

// //   get single task
// router.get("/:id", getTask);

// //   delete single task
// router.delete("/:id", deleteTask);

// //   update single task
// router.put("/:id", updateTask);

// //   update single task with limited fields
// router.patch("/:id", updateTask);

module.exports = router;

