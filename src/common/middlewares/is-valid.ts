import axios from "axios";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { State } from "../../controllers/mongo/dump";


interface Valid {
    isValid: boolean
}

// declare global {
//   namespace Express {
//     interface Request {
//       currentUser?: UserPayload;
//     }
//   }
// }

export const isValid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const {id, baseUrl}= req.body
  if (!req.headers.authorization) {
    return next();
  }

  const jwtToken = req.headers.authorization.split(" ")[1];

  try {
    const payload = jwt.verify(
      jwtToken,
      process.env.JWT_KEY!
    ) as unknown as Valid;

    if(payload.isValid){
        next()
    }else{
        await axios.post(`${baseUrl}/logger`, {id, message: "Invalid", data: '', state: State.Failed})
    }
  } catch (err) {
     await axios.post(`${baseUrl}/logger`, {id, message: "Invalid", data: '', state: State.Failed})
    }

  next();
};
