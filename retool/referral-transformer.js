const changes = referralsTable.changesetArray;
const allRows = referralsTable.data;

const finalPayload = changes.map(function(change) {
  var recordId = change.id || change.ID || change['T ID'];

  var originalRow = allRows.find(function(row) {
    return row.id === recordId || row['T ID'] === recordId;
  });

  function isChecked(retoolName, dbName) {
    var val;
    if (change[retoolName] !== undefined) {
      val = change[retoolName];
    } else if (change[dbName] !== undefined) {
      val = change[dbName];
    } else {
      val = originalRow[dbName];
    }
    return val === true || val === "true";
  }

  var s1_done = isChecked('Session 1', 's_1');
  var s2_done = isChecked('Session 2', 's_2');
  var s3_done = isChecked('Session 3', 's_3');

  var cleanUpdate = {
    id: recordId,
    s_1: s1_done,
    s_2: s2_done,
    s_3: s3_done,
    all_completed: (s1_done && s2_done && s3_done)
  };

  if (change['Reason for No Signup'] !== undefined) {
    cleanUpdate.reason_nosignup = change['Reason for No Signup'];
  } else if (change.reason_nosignup !== undefined) {
    cleanUpdate.reason_nosignup = change.reason_nosignup;
  }

  if (change['Sale Objection Reason'] !== undefined) {
    cleanUpdate.sale_objection_reason = change['Sale Objection Reason'];
  } else if (change.sale_objection_reason !== undefined) {
    cleanUpdate.sale_objection_reason = change.sale_objection_reason;
  }

  return cleanUpdate;
});

return finalPayload;
