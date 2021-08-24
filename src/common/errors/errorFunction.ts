import axios from "axios";
import { State } from "../../controllers/mongo/dump";

export const errorFunction= async (baseUrl: string, message: string, id: string, data: string, state: State): Promise<void>=>{
    await axios.post(`${baseUrl}/api/v1/backups/logger`, {id, message, data, state})
}
