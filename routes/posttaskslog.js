const { get, run } = require("../helpers");

async function postTaskslog(req, res) {
    /**
     * Inserts tasks of one team from checkpoint into db
     *
     * First inserts each task into task_log with completion status.
     * Then inserts into arrival_log the departion status of the team from checkpoint.
     */

    const { tasks, team, checkpoint } = req.body;
    console.log(
        `POST request to /taskslog from ${req.ip}, checkpoint: ${req.query.key} body: ${JSON.stringify(req.body)}`,
    );

    if (!tasks || !Array.isArray(tasks) || !team || !checkpoint) {
        return res.status(400).send({
            error: "Missing required fields: tasks, team, or checkpoint.",
        });
    }

    try {
        await run("BEGIN TRANSACTION");

        // Check if tasks aren't already logged
        const log = await get(
            "SELECT * FROM arrival_log WHERE checkpoint_id = ? AND team_id = ? AND status = 'departed'",
            [checkpoint, team],
        );

        if (log && log.status == "departed") {
            await run("ROLLBACK"); // End the transaction
            return res.status(400).send({
                error: "Team has already departed from this checkpoint.",
            });
        }

        // Insert each task separately
        for (const t of tasks) {
            const params = [t.id, team, t.completed ? 1 : 0];
            await run(
                "INSERT INTO task_log (task_id, team_id, completed) VALUES (?, ?, ?)",
                params,
            );
        }

        // Log the departion of team from the checkpoint
        const params = [checkpoint, team, "departed"];
        await run(
            "INSERT INTO arrival_log (checkpoint_id, team_id, status) VALUES (?, ?, ?)",
            params,
        );

        await run("COMMIT");

        res.sendStatus(201);
    } catch (err) {
        console.error("Transaction failed, rolling back:", err);

        try {
            await run("ROLLBACK");
        } catch (rollbackErr) {
            console.error("Failed to rollback transaction:", rollbackErr);
        }

        if (!res.headersSent) {
            res.status(500).send({ error: "Failed to log tasks." });
        }
    }
}

module.exports = { postTaskslog };
