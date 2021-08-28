import axios from "axios";
import { Dump_State } from "../../controllers/mongo/dump";
import { Restore_State } from "../../controllers/mongo/restore";

export const loggerFunction= async (message: string, state: Dump_State | Restore_State, data: string, baseUrl: string, id?: string ): Promise<void>=>{
    try {
        axios.post(`${baseUrl}/api/v1/backups/logger`, {id, message, data, state})
    } catch (error) {
        console.log(error.message)
    }
}
