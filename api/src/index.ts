import Fastify from 'fastify';
import { textRoutes } from "./controllers/routes";
import { ZodError } from "zod";
import "dotenv/config"
import { ApiError } from './Errors/ApiError';

const app = Fastify();

app.register(textRoutes);

app.get('/health', async (request, reply) => {
    return { status: 'API is up and running' };
});

app.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
        console.log(error.message)

        return reply.status(400).send({
            message: 'Validation Error',
            issues: error.errors,
        });
    } else if (error instanceof ApiError) {
        console.log(error.message)
        return reply.status(400).send({
            message: error.message,
            issues: error
        });
    }

    console.log(error.message)
    return reply.status(500).send({
        message: 'Internal server error',
    });
});

app
    .listen({
        host: '0.0.0.0',
        port: 3333,
    })
    .then(() => {
        console.log('HTTP Server Running!');
    });
