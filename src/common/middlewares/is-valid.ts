import axios from "axios";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Dump_State } from "../../controllers/mongo/dump";
import { loggerFunction } from "./loggerFunction";

interface Valid {
  isValid: boolean;
}

export const isValid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, baseUrl } = req.body;

  if (!req.headers.authorization) {
    loggerFunction("Access Token Must be provided", Dump_State.Failed, "", baseUrl, id);
    res.end();
  } else {
    try {
      const jwtToken = req.headers.authorization!.split(" ")[1];

      const payload= jwt.verify(jwtToken, process.env.JWT_SECRET_TOKEN!, (err, decoded)=>{
        if(err){
          loggerFunction("Invalid Access Token", Dump_State.Failed, "", baseUrl, id)
          res.end()
        }
        if(decoded){
          next()
          // if(decoded.baseUrl){
          //   next()
          // }else{
          //   loggerFunction("Not Authorized", Dump_State.Failed, "", baseUrl, id);
          // }
        }
      })
      // const payload = jwt.decode(jwtToken) as unknown as Valid;
    } catch (err) {
      loggerFunction("Something in authorization gone phooss..", Dump_State.Failed, "", baseUrl, id);
    }
  }
};
