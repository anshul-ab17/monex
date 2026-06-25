import jwt from "@fastify/jwt";
import fp from "fastify-plugin";

import {env} from "@repo/config";

export default fp(async(app)=>{
    await app.register(jwt, {
        secret:env.JWT_SECRET,
        sign:{
            expiresIn:"15m", 
        },
    });
});