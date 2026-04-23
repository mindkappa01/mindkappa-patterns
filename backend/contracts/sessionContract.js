const sessionContract = {
  requiredSessionFields: [
    "started_at",
    "finished_at",
    "tests"
  ],

  requiredTestFields: [
    "test_type",
    "started_at",
    "finished_at",
    "trials"
  ],

  requiredTrialFields: [
    "trial_index",
    "axis_id",
    "axis_label",
    "left_label",
    "right_label",
    "left_angle_deg",
    "right_angle_deg",
    "choice_side",
    "choice_label",
    "choice_angle_deg",
    "reaction_time_ms",
    "timed_out",
    "timestamp"
  ]
};

module.exports = sessionContract;