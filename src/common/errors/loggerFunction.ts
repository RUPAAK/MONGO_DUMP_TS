import axios from "axios";
import { State } from "../../controllers/mongo/dump";
import { Restore_State } from "../../controllers/mongo/restore";

export const loggerFunction= async (message: string, state: State | Restore_State, data: string, baseUrl: string, id?: string ): Promise<void>=>{
    try {
        await axios.post(`${baseUrl}/api/v1/backups/logger`, {id, message, data, state})
    } catch (error) {
        console.log(error.message)
    }
}
