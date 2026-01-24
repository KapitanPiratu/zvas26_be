const { get, run } = require("../helpers");

async function postArrivallog(req, res) {
    /**
     * Logs the arrival of team
     *
     * Fist checks if team already hasn't been to checkpoint.
     * If not, then inserts into arrival_log.
     */
    const { checkpoint, team, status } = req.body;
    console.log(`POST request to /arrivallog from ${req.ip}`);

    if (!checkpoint || !team || !status) {
        return res.status(400).send({
            error: "Missing required fields: checkpoint, team, or status.",
        });
    }

    try {
        // Check if arrival isn't already logged for this checkpoint
        const log = await get(
            "SELECT id FROM arrival_log WHERE checkpoint_id = ? AND team_id = ?",
            [checkpoint, team],
        );

        if (log) {
            return res.status(400).send({
                error: "Team has already been logged at this checkpoint.",
            });
        }

        const params = [checkpoint, team, status];
        await run(
            "INSERT INTO arrival_log (checkpoint_id, team_id, status) VALUES (?, ?, ?)",
            params,
        );

        res.sendStatus(200);
    } catch (err) {
        if (!res.status) {
            res.status(500);
        }

        res.send("Failed to log arrival");
    }
}

module.exports = { postArrivallog };
