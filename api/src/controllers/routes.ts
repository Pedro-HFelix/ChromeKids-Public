import { FastifyInstance } from 'fastify';
import {analyseText} from "./TextAnalyse/analyseText";

export async function textRoutes(app: FastifyInstance) {
    app.post('/text', analyseText);
}
