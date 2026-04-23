const MCDCore = require("../backend/core/MCDCore");
const pool = require("../lib/db");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  const payload = req.body;

  try {
    const result = MCDCore.processSession(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const sessionInsert = await client.query(
        `
        INSERT INTO sessions (
          started_at,
          finished_at,
          total_tests,
          total_trials,
          valid_trials,
          overall_kappa,
          overall_r,
          overall_mean_reaction_time_ms,
          overall_reversals,
          overall_longest_run,
          most_stable_test,
          least_stable_test,
          fastest_test,
          slowest_test,
          raw_payload_json,
          session_metrics_json,
          display_summary_json
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17
        )
        RETURNING id
        `,
        [
          result.session_metrics?.started_at || null,
          result.session_metrics?.finished_at || null,
          result.session_metrics?.total_tests || null,
          result.session_metrics?.total_trials || null,
          result.session_metrics?.valid_trials || null,
          result.session_metrics?.overall_kappa || null,
          result.session_metrics?.overall_r || null,
          result.session_metrics?.overall_mean_reaction_time_ms || null,
          result.session_metrics?.overall_reversals || null,
          result.session_metrics?.overall_longest_run || null,
          result.session_metrics?.most_stable_test || null,
          result.session_metrics?.least_stable_test || null,
          result.session_metrics?.fastest_test || null,
          result.session_metrics?.slowest_test || null,
          JSON.stringify(payload),
          JSON.stringify(result.session_metrics || {}),
          JSON.stringify(result.display_summary || {})
        ]
      );

      const sessionId = sessionInsert.rows[0].id;

      for (const test of result.test_metrics || []) {
        const originalTest =
          (payload.tests || []).find((t) => t.test_type === test.test_type) || null;

        const testInsert = await client.query(
          `
          INSERT INTO tests (
            session_id,
            test_type,
            started_at,
            finished_at,
            duration_ms,
            total_trials,
            valid_trials,
            timeout_trials,
            left_count,
            right_count,
            mean_reaction_time_ms,
            reversals,
            longest_run,
            r,
            kappa,
            consistency_label,
            speed_label,
            continuity_label
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
          RETURNING id
          `,
          [
            sessionId,
            test.test_type || null,
            test.started_at || null,
            test.finished_at || null,
            test.duration_ms || null,
            test.total_trials || null,
            test.valid_trials || null,
            test.timeout_trials || null,
            test.left_count || null,
            test.right_count || null,
            test.mean_reaction_time_ms || null,
            test.reversals || null,
            test.longest_run || null,
            test.r || null,
            test.kappa || null,
            test.consistency_label || null,
            test.speed_label || null,
            test.continuity_label || null
          ]
        );

        const testId = testInsert.rows[0].id;

        for (const trial of originalTest?.trials || []) {
          await client.query(
            `
            INSERT INTO trials (
              test_id,
              trial_index,
              axis_id,
              axis_label,
              left_label,
              right_label,
              left_angle_deg,
              right_angle_deg,
              choice_side,
              choice_label,
              choice_angle_deg,
              reaction_time_ms,
              timed_out,
              timestamp
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12, $13, $14
            )
            `,
            [
              testId,
              trial.trial_index || null,
              trial.axis_id || null,
              trial.axis_label || null,
              trial.left_label || null,
              trial.right_label || null,
              trial.left_angle_deg ?? null,
              trial.right_angle_deg ?? null,
              trial.choice_side || null,
              trial.choice_label || null,
              trial.choice_angle_deg ?? null,
              trial.reaction_time_ms ?? null,
              trial.timed_out ?? null,
              trial.timestamp || null
            ]
          );
        }
      }

      await client.query("COMMIT");
    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Erro salvando no banco:", dbError);
      throw dbError;
    } finally {
      client.release();
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro em /api/session:", error);

    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};