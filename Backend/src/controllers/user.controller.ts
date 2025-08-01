import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";

interface RegisterUserRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const registerUser = async(req: Request<{}, {}, RegisterUserRequestBody>, res: Response)  => {
    try {
        const {name, email, phone, password} = req.body;
        if(! name || !email || !phone  || !password){
            return res.status(400).json({ msg: "All fields are required" });
        }
        const isDuplicateEmail = await User.findOne({
            where: {
                email: email
            }
        })
        if(isDuplicateEmail){
            return res.status(409).json({msg:"This Email already exist in DB"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name,
            email: email,
            phoneNo: phone,
            password: hashedPassword
        });
        const { password: _, ...userWithoutPassword } = user.get({ plain: true });
        return res.status(201).json({data: userWithoutPassword});


    } catch (error) {
          console.error("Register error:", error);
        return res.status(500).json("Something went wrong");
    }
}