import app from "./app";

// start listening on the port
const server = app.then(app => {
    const port = app.get("port");
    return app.listen(port, () => {
        console.log(`Server ready at http://localhost:${port}/graphql`);
    });
})

export default server;
