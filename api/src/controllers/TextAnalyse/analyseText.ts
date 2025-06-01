import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AzureAnalyseText } from "@/use-cases/azureAnalyseText";

export async function analyseText(request: FastifyRequest,
  reply: FastifyReply) {

  const requestSchema = z.object({
    url: z.string(),
    textChunks: z.string().array(),
  });

  const { textChunks } = requestSchema.parse(request.body);

  const azureAnalyseTextUseCase = new AzureAnalyseText();

  const analyseText = await azureAnalyseTextUseCase.execute(textChunks);
  console.log(analyseText);
  return reply.status(200).send(analyseText);
}