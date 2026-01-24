const { all } = require("../helpers");

async function getTasks(req, res) {
    /**
     * Returns tasks from db.
     *
     * If the request query contains checkpoint_id (c), only tasks for this checkpoint are returned.
     * Otherwise all tasks will be returned.
     */

    console.log(`GET request to /tasks from ${req.ip}`);
    const checkpoint = req.query.c;

    try {
        let query = "SELECT * FROM task";
        const params = [];

        if (checkpoint) {
            query += " WHERE checkpoint_id = ?";
            params.push(checkpoint);
        }
        const rows = await all(query, params);

        res.send(rows);
    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to get tasks");
    }
}

module.exports = { getTasks };
