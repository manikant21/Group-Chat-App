import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { JWT_SECRET } from "../config/server.config.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

interface RegisterUserRequestBody {
    name: string;
    email: string;
    phone: string;
    password: string;
}

function generateAccessToken(id: number) {
    return jwt.sign({ userId: id }, JWT_SECRET);
}

export const registerUser = async (req: Request<{}, {}, RegisterUserRequestBody>, res: Response) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        const isDuplicateEmail = await User.findOne({
            where: {
                email: email
            }
        })
        if (isDuplicateEmail) {
            return res.status(409).json({ msg: "This Email already exist in DB" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name,
            email: email,
            phoneNo: phone,
            password: hashedPassword
        });
        const { password: _, ...userWithoutPassword } = user.get({ plain: true });
        const token = generateAccessToken(userWithoutPassword.id);
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     sameSite: 'lax',
        //     secure: false,
        //     maxAge: 3600000,
        //     path: '/',
        //     domain: undefined
        // });
        console.log(token);
        return res.status(201).json({ data: userWithoutPassword , token});


    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json("Something went wrong");
    }
}

interface LoginUserRequestBody {
    email: string,
    password: string,
}

export const loginUser = async (req: Request<{}, {}, LoginUserRequestBody>, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        const checkEmail = await User.findOne({
            where: {
                email: email
            }
        })
        if (!checkEmail) {
            return res.status(404).json({ msg: "User not found" })
        };
        const isMatch = await bcrypt.compare(password, checkEmail.password);
        if (!isMatch) {
            return res.status(401).json({ msg: "User not authorized" })
        }
        const token = generateAccessToken(checkEmail.id);
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     sameSite: 'lax',
        //     secure: false,
        //     maxAge: 3600000,
        //     path: '/',
        //     domain: undefined
        // });
        // console.log(token);


        return res.status(201).json({ msg: "User logged in succcessfully!", token })

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json("Something went wrong");
    }
}

// export const logoutUser = (req: Request<{}, {}, {}>, res: Response) => {
//     try {
//         res.clearCookie("token", {
//             httpOnly: true,
//             sameSite: "lax"
//         });
//         res.status(201).json({ message: "Logged out successfully" });

//     } catch (error) {
//         console.error("Login error:", error);
//         return res.status(500).json("Something went wrong");
//     }
// }