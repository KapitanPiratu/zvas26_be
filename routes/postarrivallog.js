const { get, run } = require("../helpers");

async function postArrivallog(req, res) {
    /**
     * Logs the arrival of team
     *
     * Fist checks if team already hasn't been to checkpoint.
     * If not, then inserts into arrival_log.
     */
    const { checkpoint, team, status } = req.body;
    console.log(
        `POST request to /arrivallog from ${req.ip}, checkpoint: ${req.query.key} body: ${JSON.stringify(req.body)}`,
    );

    if (!checkpoint || !team || !status) {
        return res.status(400).send({
            error: "Missing required fields: checkpoint, team, or status.",
        });
    }

    try {
        await run("BEGIN TRANSACTION");

        // Check if arrival isn't already logged for this checkpoint
        const log = await get(
            "SELECT id FROM arrival_log WHERE checkpoint_id = ? AND team_id = ?",
            [checkpoint, team],
        );

        if (log) {
            await run("ROLLBACK");
            return res.status(400).send({
                error: "Team has already been logged at this checkpoint.",
            });
        }

        // Check if the team is on correct checkpoint
        const teamPath = await get("SELECT path FROM team WHERE id = ?", [
            team,
        ]);

        console.log("---------");
        console.log(teamPath.path[0]);

        if (teamPath.path[0] != checkpoint) {
            await run("ROLLBACK");
            return res.status(400).send({
                error: `Wrong checkpoint, hint: ${teamPath.path[0]}`,
            });
        }

        const params = [checkpoint, team, status];
        await run(
            "INSERT INTO arrival_log (checkpoint_id, team_id, status) VALUES (?, ?, ?)",
            params,
        );

        await run("COMMIT");

        res.sendStatus(200);
    } catch (err) {
        console.error("Transaction failed, rolling back:", err);

        try {
            await run("ROLLBACK");
        } catch (rollbackErr) {
            console.error("Failed to rollback transaction:", rollbackErr);
        }

        if (!res.headersSent) {
            res.status(500).send("Failed to log arrival");
        }
    }
}

module.exports = { postArrivallog };
