const Hapi = require('@hapi/hapi');
const { compile } = require('ejs');
const { request } = require('http');
const Path = require('path')
const mongoose = require('mongoose')

//connecting mongodb
mongoose
    .connect('mongodb://localhost:27017/hapi')
    .then(() => console.log('DB connected'))
    .catch((err) => console.error('Error connecting to the database:', err));

const Task = mongoose.model('Task', { text: String });

//adding task to db
const createTask = async (data) => {
    try {
        const newTask = new Task(data);
        await newTask.save();
        return 'task Saved'
    } catch (err) {
        console.error('Error creating task:', err);
    }
};


//hapi routes and all functions
const init = async () => {

    const server = Hapi.Server({

        //setting up port and localhost
        port: 8000,
        host: "localhost",


        //setting serving static files
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    })

    // dependencies importing
    await server.register([
        require('@hapi/inert'),
        require('@hapi/vision')
    ]);


    //Middlewares with life cycle hooks

    // Pre-handler middleware to log request
    server.ext('onRequest', (request, h) => {
        console.log(`Request received for ${request.method.toUpperCase()} ${request.path}`);
        return h.continue // Continue to the next lifecycle hook
    })

    // Simulating authentication middleware
    // server.ext('onPreHandler', (request, h) => {
    //     const authHeader = request.headers.authorization;

    //     if (!authHeader || authHeader !== 'Bearer mysecretkey') {
    //         return h.response('Unauthorized').code(401);
    //     }

    //     return h.continue;
    // });


    // Middleware to modify the response
    // server.ext('onPreResponse', (request, h) => {
    //     const response = request.response;

    //     // Check if it's a valid response object
    //     if (response.isBoom) {
    //         // Modify error responses, if needed
    //         response.output.payload.message = 'Custom error message!';
    //     } else {
    //         // Modify normal responses
    //         response.header('X-Custom-Header', 'Hello from Middleware!');
    //     }

    //     return h.continue; // Proceed to send the response
    // });


    //setting up view engine
    server.views({
        engines: {
            ejs: require('ejs'), // Register EJS for .html templates
        },
        relativeTo: __dirname, // Base path for templates
        path: 'views',     // Directory where templates are stored
    });

    server.route({
        method: 'GET',
        path: '/{name?}',
        handler: (request, h) => {
            try {
                const gestName = request.params.name || 'Guest';
                return h.view('home', { title: gestName });
            } catch (err) {
                console.error('Error in handler:', err);
                return h.response('Internal Server Error').code(500);
            }
        }
    })

    server.route({
        method: "GET",
        path: "/png",
        handler: (request, h) => {
            return h.file('hapi.png');
        }
    })


    server.route({
        method: 'GET',
        path: '/addingTask',
        handler: (request, h) => {
            return h.view('task')
        }
    })

    server.route({
        method: "POST",
        path: "/addTask",
        handler: async (request, h) => {
            // Call the function to create a task
            const taskData = request.payload
            const saved = await createTask(taskData);
            return h.response(saved).code(201);
        }
    })

    server.route({
        method: "GET",
        path: "/db",
        handler: (request, h) => {
            const datas = Task.find()
            return datas
        }
    })


    server.route({
        method: "GET",
        path: "/user/{name}",
        handler: (request, h) => {
            const username = request.params.name
            return `Hello ${username}`
        }
    })

    await server.start()
    console.log(`server is running on ${server.info.uri}`)

}
process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

init();



