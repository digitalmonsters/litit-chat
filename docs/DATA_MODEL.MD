users: {
  phone: "+1-555-123-4567",
  audioCallEnabled: true,
  stars: 1200,
  tier: "litplus"
}

calls/{id}: {
  callerId, calleeId, roomId,
  startedAt, endedAt, durationMins,
  cost, status, ghlInvoiceId
}

livestreams/{id}: {
  hostId, roomId, viewers: [uids],
  entryFee, tips, battleStars: {hostA:1200, hostB:900},
  startedAt, endedAt
}
