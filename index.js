const express = require("express");
const app = express();
const cors = require("cors");

const { run, get, all } = require("./helpers.js");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send({ msg: "hello" });
});

app.get("/teams", async (req, res) => {
    /**
     * Returns teams from db.
     */
    console.log(`GET request to /teams from ${req.ip}`);

    try {
        const rows = await all("SELECT * FROM team");

        res.send(rows);
    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to get teams");
    }
});

app.get("/tasks", async (req, res) => {
    /**
     * Returns tasks from db.
     *
     * If the request query contains checkpoint_id (c), only tasks for this checkpoint are returned.
     * Otherwise all tasks will be returned.
     */

    console.log(`GET request to /tasks from ${req.ip}`);
    const checkpoint = req.query.c;

    try {
        const rows = await all(
            `SELECT * FROM task${
                checkpoint ? ` WHERE checkpoint_id = ${checkpoint}` : ""
            }`
        );

        res.send(rows);
    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to get tasks");
    }
});

app.post("/taskslog", async (req, res) => {
    /**
     * Inserts tasks of one team from checkpoint into db
     *
     * First inserts each task into task_log with completion status.
     * Then inserts into arrival_log the departion status of the team from checkpoint.
     */

    const { tasks, team, checkpoint } = req.body;
    console.log(`POST request to /tasks from ${req.ip}`);

    if (!tasks || !Array.isArray(tasks) || !team || !checkpoint) {
        res.sendStatus(400);
    }

    try {
        await run("BEGIN TRANSACTION");

        // Check if tasks aren't already logged
        const log = await get(
            "SELECT * FROM arrival_log WHERE checkpoint_id = ? AND team_id = ? AND status = 'departed'",
            [checkpoint, team]
        );

        if (log && log.status == "departed") {
            console.log(log);
            res.status(400);
            throw new Error("Team already logged");
        }

        // Insert each task separately
        for (const t of tasks) {
            const params = [t.id, team, t.completed ? 1 : 0];
            await run(
                "INSERT INTO task_log (task_id, team_id, completed) VALUES (?, ?, ?)",
                params
            );
        }

        // Log the departion of team from the checkpoint
        const params = [checkpoint, team, "departed"];
        await run(
            "INSERT INTO arrival_log (checkpoint_id, team_id, status) VALUES (?, ?, ?)",
            params
        );

        await run("COMMIT");

        res.sendStatus(201);
    } catch (err) {
        console.log("Transaction failed, rolling back:", err);

        try {
            run("ROLLBACK");
        } catch (rollbackErr) {
            console.log("Failed to rollback", rollbackErr);
        }

        if (!res.status) {
            res.status(500);
        }

        res.send("Failed to log tasks.");
    }
});

const PORT = process.env.BE_PORT || 3001;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
