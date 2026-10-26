/**
 * CFC Red Futsal — U12 boys. Peer pack to outdoor CFC Red.
 * Court: x 0–20 (width, meters), y 0–40 (length). Attack toward TOP (y → 0).
 * Our goal is the bottom on every diagram.
 *
 * Outfield jobs are spaces, not names: High, Low, Left, Right.
 * Letters A–D are the players in this rep. The word under the letter is the
 * space he is holding in the still picture. It is not his permanent position.
 *
 * Zone 14 sits centrally just outside the opponent's 6m penalty arc
 * (about x 7.2–12.8, y 6.2–9.6). That is the futsal version of the outdoor
 * pocket immediately outside the opposing box — it does not roam with the ball.
 *
 * Keeper restarts follow the idea "feet, then a wide release." This pack does
 * not state a league back-pass rule. No set-piece routines.
 */
(function () {
  "use strict";

  const CONFIG = {
    teamName: "CFC Red",
    appName: "CFC Red Futsal",
    storageKey: "cfc-futsal-soccer-iq-progress",
    packId: "cfcFutsal",
    colors: {
      ours: "#8b1a1a",
      oursStroke: "#4a0d0d",
      oursText: "#ffffff",
      opp: "#1a3d66",
      oppStroke: "#0b2440",
      oppText: "#ffffff",
      ball: "#ffffff",
      highlight: "#f0c14b",
      correct: "#2d6a4f",
      incorrect: "#9b2226",
      zone: "rgba(240, 193, 75, 0.35)"
    },
    pitch: { kind: "futsal", width: 20, length: 40 },
    scoring: { decisionPoint: 1, rationalePoint: 1 },
    mastery: { learning: 60, developing: 80, ready: 90 },
    challengeCount: 8
  };

  const ZONE14 = { id: "z14", label: "Zone 14", x: 7.15, y: 6.15, w: 5.7, h: 3.45 };
  const SEE = "We attack toward the top. A, B, C, and D are players. The word under the letter is the space he holds right now — not a fixed position.";
  const SEE_DEF = "Our goal is the bottom. The top of the picture is toward their goal. Count the players in each horizontal band.";

  function ours(rows) {
    return rows.map((r) => ({
      id: r[0],
      team: "ours",
      number: r[1],
      role: r[2],
      label: r[2],
      x: r[3],
      y: r[4]
    }));
  }

  function opps(rows) {
    return rows.map((r) => ({
      id: r[0],
      team: "opp",
      number: r[1],
      role: r[2] || "Defender",
      label: r[2] || "",
      hideLabel: !r[2],
      x: r[3],
      y: r[4]
    }));
  }

  const GK = ["our-gk", "GK", "GK", 10, 36.6];

  function why(correct, wrongA, wrongB) {
    return {
      rationaleOptions: [
        { id: "r1", label: correct },
        { id: "r2", label: wrongA },
        { id: "r3", label: wrongB }
      ],
      correctRationale: "r1"
    };
  }

  function choice(answer, rows) {
    return {
      options: rows.map((r) => ({ id: r[0], label: r[1], correct: r[0] === answer })),
      correctAnswer: answer
    };
  }

  const GLOSSARY = [
    { term: "High", definition: "The outfield job that keeps height toward their goal: pin a defender, threaten behind, or be the option beyond pressure. Any of the four can fill it." },
    { term: "Low", definition: "The outfield job underneath the ball: a safe pass, a way to recycle, and help on the transition. Low is not a permanent defender’s name." },
    { term: "Left", definition: "The job that holds or creates width and a passing angle on our left, as we attack toward the top of the court." },
    { term: "Right", definition: "The job that holds or creates width and a passing angle on our right, as we attack toward the top of the court." },
    { term: "Zone 14", definition: "The central pocket just outside the opponent’s penalty area, at the top of their 6m arc. Same idea as outdoor Zone 14: the space immediately outside their box. It does not follow the ball around the court. Arrive in 14. Don’t live in 14." },
    { term: "Show, create, or clear", definition: "In Zone 14: show for the ball, create if the reception gives an advantage, or clear out if you are not useful. A second arrival should start an exchange, not two players standing in the same pocket." },
    { term: "Rotation", definition: "One player takes a new space and another leaves it, so the four jobs stay covered. It is useful when it creates or protects an advantage. Spinning for its own sake is not the point." },
    { term: "Rebalance", definition: "After someone moves, the others check height, depth, width, and the keeper. Some adjust. Some stay. The picture should end connected, not with a duplicate and a hole." },
    { term: "Compact diamond", definition: "Our defensive reference: four outfielders in a 1-2-1, keeper behind. It protects the middle. It is a shape we can flex, not four permanent roles." },
    { term: "Pressure", definition: "The nearest connected player delays or steers the ball. He does not have to win it alone." },
    { term: "Cover", definition: "The next player protects the pass or dribble behind the pressure, usually inside and goal-side." },
    { term: "Balance", definition: "The far-side player stays connected so a shift does not open the middle or the weak side." },
    { term: "Counterpress", definition: "Just after we lose it, we squeeze if we are close and someone is covering. If they are out and facing our goal, this is the wrong picture." },
    { term: "Recover", definition: "Get goal-side and rebuild the compact diamond when immediate pressure is not safe." },
    { term: "Far post", definition: "The post farther from the ball on a wide finish. With four outfielders, one runner can attack it while another supports the cutback and one stays for security." },
    { term: "Goalkeeper support", definition: "The keeper is a real passing option in buildup: a safe release under pressure, then a pass to an open outlet. He is not a fifth outfielder dribbling into the middle every time." }
  ];

  const NAV_GROUPS = [
    { id: "futsal-attack-group", label: "Attack", modules: ["futsal-zone14", "futsal-rotation", "futsal-finish"] },
    { id: "futsal-defend-group", label: "Defend", modules: ["futsal-diamond", "futsal-motion", "futsal-transitions"] }
  ];

  const MODULES = [
    {
      id: "futsal-jobs",
      title: "The Four Jobs",
      subtitle: "High · Low · Left · Right",
      hash: "futsal-four-jobs",
      purpose: "See which space is empty and fill it. The job stays. The player can change.",
      chapters: ["futsal-jobs"],
      overview: {
        headline: "Freedom to rotate. Obligation to rebalance.",
        intro: "Four outfield spaces, plus the keeper. High keeps the threat toward their goal. Low is the pass underneath. Left and right give width and an angle. Nobody owns a space for the whole game.",
        principles: [
          { title: "Spaces, not names", body: "A, B, C, and D are just the players in this picture. High, Low, Left, and Right are the jobs. Next rep, a different letter can be high." },
          { title: "Fill what is missing", body: "If two players stand in one job, another job is empty. The fix is a rebalance, not a speech about positions." },
          { title: "Staying is a skill", body: "When your space is still the useful one, you stay. Motion is for an advantage, not for looking busy." }
        ],
        cues: ["Jobs, not names.", "Fill what’s missing.", "If your space is still right, stay."]
      }
    },
    {
      id: "futsal-zone14",
      title: "Show, Create, or Clear",
      subtitle: "Zone 14",
      hash: "futsal-zone14",
      group: "futsal-attack-group",
      purpose: "Use the central pocket at the top of their box. Arrive, do the job, and leave when you are not useful.",
      chapters: ["futsal-zone14"],
      overview: {
        headline: "Arrive in 14. Don’t live in 14.",
        intro: "Zone 14 is the central pocket just outside their penalty area — the futsal version of the outdoor space right outside the box. Any of the four can check in. It is not a fifth player’s spot.",
        principles: [
          { title: "Show", body: "Arrive so a teammate has a forward angle. You are there to be a pass or to drag a defender." },
          { title: "Create", body: "If you receive and you can turn, combine, slip a pass, or shoot, stay and use it. Dragging a defender so a teammate is free counts." },
          { title: "Clear", body: "If the lane is dead and you have not moved a defender, leave within a moment so the next player can arrive. That is a feel, not a clock." },
          { title: "Two in the pocket", body: "A second arrival means exchange. The first player clears to an open job. We do not hang out together in 14." }
        ],
        cues: ["Arrive in 14. Don’t live in 14.", "Show, create, or clear.", "Second man in: exchange."]
      }
    },
    {
      id: "futsal-rotation",
      title: "The Rotation",
      subtitle: "One in, one out, others rebalance",
      hash: "futsal-rotation",
      group: "futsal-attack-group",
      purpose: "Change who is in the space without losing height, depth, or width. Sometimes the right move is to stay.",
      chapters: ["futsal-rotation"],
      overview: {
        headline: "One enters. One leaves. The picture stays connected.",
        intro: "A rotation is not a circle we always run. Someone takes a useful space, someone vacates, and the others check what is now empty. Different players can start it.",
        principles: [
          { title: "Advantage, or don’t", body: "Rotate to open a lane, to fix a hole, or to keep the ball. If the pass is already there, play it." },
          { title: "Far side matters", body: "When the ball-side player leaves his width, someone has to decide whether that width is now the hole." },
          { title: "Stay is allowed", body: "If opponents are not tracking and the lane is good, the player in 14 receives and attacks. We do not exchange out of habit." }
        ],
        cues: ["One in, one out.", "Rebalance the hole.", "Lane is on? Stay and play."]
      }
    },
    {
      id: "futsal-keeper",
      title: "Keeper as Fifth",
      subtitle: "Build with the goalkeeper",
      hash: "futsal-keeper",
      purpose: "Use the keeper as a real pass when pressure arrives, then find the open outlet. He does not dribble into the middle.",
      chapters: ["futsal-keeper"],
      overview: {
        headline: "The keeper is a pass, not a fifth runner.",
        intro: "Under pressure, his feet are often the safe release. He then plays the outlet with the better angle. The four jobs stay on the court — we do not all run back to him.",
        principles: [
          { title: "Release", body: "If the deep player is pressed and the keeper is free, play his feet. We are not teaching a trick restart. We are keeping the ball." },
          { title: "Angle", body: "From the keeper, pick the outlet that is actually open. A high player can pin. A wide player can receive." },
          { title: "Security", body: "If the middle is a trap, he keeps the goal safe and plays simple. He does not become another dribbler in Zone 14." }
        ],
        cues: ["Pressed? Keeper’s feet.", "Then the open outlet.", "Don’t all run to the keeper."]
      }
    },
    {
      id: "futsal-finish",
      title: "Finish the Advantage",
      subtitle: "Shoot, combine, or change the side",
      hash: "futsal-finish",
      group: "futsal-attack-group",
      purpose: "When 14 or the wide attack gives you something, use it. Don’t add an extra rotation.",
      chapters: ["futsal-finish"],
      overview: {
        headline: "If it’s on, finish it.",
        intro: "Same ideas you know from outdoor — a shot, a third-player pass, a far-post run, a cutback — with only four outfielders. Someone still has to keep us safe.",
        principles: [
          { title: "Facing forward", body: "Receive in 14 with a lane and you drive or shoot. A backward pass is for when the shot is not on." },
          { title: "They step to you", body: "If your check pulls a defender, the next pass is the free teammate." },
          { title: "Wide finish", body: "Far post and a cutback can both be live. The low player does not also crash the box. Four outfielders cannot fill five runs." },
          { title: "Center is jammed", body: "Move it across and rebuild the jobs. Don’t stack another body in a closed 14." }
        ],
        cues: ["Finish the advantage.", "They step, you slip it.", "Far post and a cutback — low stays."]
      }
    },
    {
      id: "futsal-diamond",
      title: "Defend the Diamond",
      subtitle: "1-2-1 · protect the middle",
      hash: "futsal-diamond",
      group: "futsal-defend-group",
      purpose: "Start from a compact 1-2-1. Pressure, cover, and keep the middle shut.",
      chapters: ["futsal-diamond"],
      overview: {
        headline: "Contract to deny space.",
        intro: "Out of possession the reference is a compact diamond: one higher, two in the middle band, one closer to our goal, keeper behind. Our goal is the bottom of the picture. The diamond can tilt. It should not split.",
        principles: [
          { title: "Protect the middle", body: "Especially deny a pass into our Zone 14 — the pocket at the top of our own penalty arc." },
          { title: "Pressure plus cover", body: "The nearest connected player delays the ball. The next one is goal-side and inside, not standing next to him as a second chaser." },
          { title: "Shift as a group", body: "The ball goes wide, the diamond slides. We do not each pick an opponent and leave the center." },
          { title: "Width can be conceded", body: "A harmless wide touch is fine. Opening the middle to go touch the wide player is not." }
        ],
        cues: ["Protect the middle.", "Step, and have cover.", "Shift together."]
      }
    },
    {
      id: "futsal-motion",
      title: "Diamond in Motion",
      subtitle: "1-2-1 can become 3-1 or 1-3",
      hash: "futsal-motion",
      group: "futsal-defend-group",
      purpose: "Change the bands when the ball, the goal, and the cover say so. The numbers have to match the picture.",
      chapters: ["futsal-motion"],
      overview: {
        headline: "The diamond flexes. It does not march.",
        intro: "1-2-1 is home. A 3-1 means three in the higher band and one behind them. A 1-3 means one higher and three closer to our goal. Those are descriptions of this picture, read from their goal toward ours. They are not permanent formations.",
        principles: [
          { title: "Read the bands", body: "Count before you name it. If the picture has one high and three deep, it is a 1-3 for this moment." },
          { title: "Tilt is normal", body: "A staggered diamond toward the ball is fine. A perfect plus-sign is not the standard." },
          { title: "Pressure needs a protector", body: "Several can step up only when one player still guards the pass that breaks the press." },
          { title: "Depth when the goal is threatened", body: "A far-post run and a ball near our box ask for more players goal-side, plus someone who can still screen." }
        ],
        cues: ["Count the bands.", "Tilt toward the ball.", "Someone protects the escape."]
      }
    },
    {
      id: "futsal-transitions",
      title: "Transitions",
      subtitle: "Lose it · win it",
      hash: "futsal-transitions",
      group: "futsal-defend-group",
      purpose: "Decide counterpress or recover when we lose it, and penetrate or expand when we win it.",
      chapters: ["futsal-transitions"],
      overview: {
        headline: "First picture, then the action.",
        intro: "Lose it with numbers and cover nearby: counterpress. Lose it stretched, with them facing our goal: recover into the diamond. Win it with a free player goal-side: play forward. Win it into a block: expand the four jobs and use the keeper if we need him.",
        principles: [
          { title: "Counterpress", body: "Close, and someone is covering the next action. Squeeze together." },
          { title: "Recover", body: "They are out. Get goal-side. The diamond comes back before we hunt." },
          { title: "Penetrate", body: "The first look after we win it is the open space toward their goal." },
          { title: "Expand", body: "If that space is closed, we find high, low, left, and right again. The keeper can help us keep it." }
        ],
        cues: ["Close and covered? Counterpress.", "They’re out? Recover.", "Win it and look forward."]
      }
    },
    {
      id: "futsal-challenge",
      title: "Mixed Futsal Challenge",
      hash: "futsal-challenge",
      purpose: "Unlabeled scenes from every futsal module. Eight questions. Results by idea.",
      isChallenge: true
    }
  ];

  const SCENARIOS = [
    Object.assign({
      id: "futsal-f01",
      module: "futsal-jobs",
      chapter: "futsal-jobs",
      chapterTitle: "Four jobs",
      title: "Which job is empty?",
      concept: "futsal-jobs",
      interactionType: "multiple-choice",
      prompt: "Look at the four outfielders. Which job is missing?",
      seeIt: SEE + " A and B are both on the right. C is high. D is low. The left touchline side is empty.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.8, 16],
        ["our-b", "B", "Right", 13.2, 21],
        ["our-c", "C", "High", 10, 10.4],
        ["our-d", "D", "Low", 10, 27]
      ]),
      ball: { x: 15.2, y: 16.8 },
      hint: "Two players are in one vertical lane. The other wide lane has nobody.",
      explanation: "Left is empty, so we are narrow. We gain an angle and a switch as soon as someone takes the left. Leaving both on the right makes one defender’s job easy and kills the far-side pass.",
      coachingCue: "Fill what’s missing.",
      animationSteps: [{ type: "move", playerId: "our-b", to: { x: 4.4, y: 18 }, duration: 700, caption: "B takes the left. Right, high, and low stay." }]
    }, choice("left", [
      ["left", "Left — nobody is holding that width"],
      ["high", "High — C is not far enough up"],
      ["low", "Low — D should be next to the keeper"],
      ["both", "Nothing. Two on the right is the shape"]
    ]), why("The left lane has no player, so one job is open.", "High and low each already have someone.", "Doubling the right is the shape we want.")),

    Object.assign({
      id: "futsal-f02",
      module: "futsal-jobs",
      chapter: "futsal-jobs",
      chapterTitle: "Four jobs",
      title: "Low is already taken",
      concept: "futsal-jobs",
      interactionType: "multiple-choice",
      prompt: "D already has the ball in the low job. B has dropped next to him. What is the rebalance?",
      seeIt: SEE + " D is low on the ball. B has left the left side and is standing next to D. A is right. C is high. Left is empty.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.6, 18],
        ["our-b", "B", "Low", 7.6, 26.5],
        ["our-c", "C", "High", 10, 10.5],
        ["our-d", "D", "Low", 11.2, 28]
      ]),
      ball: { x: 11.2, y: 26.6 },
      opponents: opps([["opp-1", 4, "", 10, 22]]),
      hint: "Count the low job. Then look for the lane with zero.",
      explanation: "D is already the underneath pass. B’s drop duplicates low and abandons left. B goes back to the left so D can play forward or wide. If B stays, the keeper and D are crowded and the switch dies.",
      coachingCue: "Don’t duplicate. Fill the hole.",
      animationSteps: [{ type: "move", playerId: "our-b", to: { x: 4.3, y: 18 }, duration: 700, caption: "B returns to the left. D keeps low." }]
    }, choice("back-left", [
      ["back-left", "B goes back to the left. D keeps the low job"],
      ["both-low", "B stays next to D so low has two"],
      ["c-drops", "C leaves high and joins them underneath"],
      ["a-joins", "A tucks next to D as well"]
    ]), why("Low is filled. The empty job is left.", "Two underneath the ball does not create a new angle.", "High still stretches them. Don’t pull C down too.")),

    Object.assign({
      id: "futsal-f03",
      module: "futsal-jobs",
      chapter: "futsal-jobs",
      chapterTitle: "Four jobs",
      title: "Right width, and who stays",
      concept: "futsal-jobs",
      interactionType: "drag-player",
      prompt: "A checked inside from the right. Drag the teammate who should take that open right side.",
      seeIt: SEE + " A has left the right and is in the middle. C is high and should stay high. B is left and should stay left. D is low. The right lane is the hole.",
      players: ours([
        GK,
        ["our-a", "A", "Inside", 10.2, 14],
        ["our-b", "B", "Left", 4.3, 18],
        ["our-c", "C", "High", 10, 9.2],
        ["our-d", "D", "Low", 10, 27.5]
      ]),
      ball: { x: 10.2, y: 15.2 },
      dragPlayerId: "our-d",
      dragTarget: { x: 16, y: 19, r: 2.1 },
      zones: [{ id: "right", label: "Open right", x: 13.4, y: 14.5, w: 5.8, h: 10 }],
      showTeachingZones: true,
      hint: "High and left are already doing a job. The spare player is low — and the hole is right.",
      explanation: "D can take the right because low can be refilled by the keeper’s angle or by A dropping after the check. C stays high. B stays left. If C or B chase the hole, we trade one empty lane for another. Staying is their correct play.",
      coachingCue: "Fill the hole. Don’t empty a good one.",
      animationSteps: [{ type: "move", playerId: "our-d", to: { x: 16, y: 19 }, duration: 650, caption: "D takes the right. B and C stay." }]
    }, choice("right", [
      ["right", "D takes the right. High and left stay"],
      ["c-wide", "C leaves high and becomes the right player"],
      ["b-across", "B crosses from left and leaves that side empty"],
      ["nobody", "Leave the right empty and stack the middle"]
    ]), why("D is the player who can move without emptying high or left.", "C is the height. If he leaves, the pin is gone.", "B is the other width. Pulling him across makes us one-sided again.")),

    Object.assign({
      id: "futsal-f04",
      module: "futsal-jobs",
      chapter: "futsal-jobs",
      chapterTitle: "Four jobs",
      title: "A different player goes high",
      concept: "futsal-jobs",
      interactionType: "multiple-choice",
      prompt: "C was high. D is arriving from low to replace him, and C is leaving. Why is that allowed?",
      seeIt: SEE + " This time D is the one coming high, not C. A is right. B is left. The high space is being exchanged, not renamed.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.5, 17],
        ["our-b", "B", "Left", 4.5, 17.5],
        ["our-c", "C", "Leaving", 12.4, 13.5],
        ["our-d", "D", "Arriving", 8.2, 12]
      ]),
      ball: { x: 8.6, y: 18 },
      hint: "Look at the space, not the letter that used to stand there.",
      explanation: "High is a space. D can fill it if C takes another job — here, low. We keep height either way. Freezing it as “C’s spot” means the exchange can’t happen and the low job stays empty when C is stuck high.",
      coachingCue: "The job matters. The letter doesn’t.",
      animationSteps: [
        {
          type: "parallel",
          duration: 800,
          caption: "D takes high. C becomes low.",
          steps: [
            { type: "move", playerId: "our-d", to: { x: 10, y: 10.2 }, duration: 750 },
            { type: "move", playerId: "our-c", to: { x: 10, y: 26 }, duration: 750 }
          ]
        }
      ]
    }, choice("space", [
      ["space", "High is a space. D can take it if C clears to another job"],
      ["only-c", "Only C is allowed to be the high player"],
      ["both-high", "C and D should both stay high"],
      ["stop", "They should stop. Exchanges are not allowed"]
    ]), why("Whoever arrives can be high, as long as the space C left is filled.", "Locking the job to one letter stops the rotation.", "Two high and nobody low removes the safe pass.")),

    Object.assign({
      id: "futsal-zone14-01",
      module: "futsal-zone14",
      chapter: "futsal-zone14",
      chapterTitle: "Zone 14",
      title: "Find Zone 14",
      concept: "futsal-zone14",
      interactionType: "pitch-hotspot",
      prompt: "Tap Zone 14 — the central pocket at the top of their penalty area.",
      seeIt: SEE + " Their goal is the top. The 6m arc is the penalty area. Zone 14 is just outside that arc, in the center. It is not the middle of the court.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.6, 18],
        ["our-b", "B", "Left", 4.4, 18],
        ["our-c", "C", "High", 10, 12.4],
        ["our-d", "D", "Low", 10, 27]
      ]),
      opponents: opps([["opp-gk", 1, "GK", 10, 2.4]]),
      ball: { x: 10, y: 22 },
      zones: [
        ZONE14,
        { id: "mid", label: "Central midfield", x: 7.2, y: 17.2, w: 5.6, h: 4.2 },
        { id: "wide", label: "Wide left", x: 0.8, y: 12, w: 3.6, h: 6 }
      ],
      correctAnswer: "z14",
      hint: "Outdoor Zone 14 is just outside the other team’s box. Same idea here: just outside their arc, central.",
      explanation: "Zone 14 is the pocket on the top of their 6m arc, in the center. Midfield is too deep to be 14, and the wide lane is a width job. If we call every central touch Zone 14, the arrival loses its point.",
      coachingCue: "14 is the top of their box. Not midfield."
    }, why("It is the central pocket immediately outside their penalty arc.", "Central midfield is a different space.", "Width is left or right, not 14.")),

    Object.assign({
      id: "futsal-zone14-02",
      module: "futsal-zone14",
      chapter: "futsal-zone14",
      chapterTitle: "Zone 14",
      title: "Arrive and show",
      concept: "futsal-zone14",
      interactionType: "multiple-choice",
      prompt: "B has the ball on the left with a lane into Zone 14. What should C do?",
      seeIt: SEE + " B is wide left on the ball. The lane into the central pocket is open. C is just outside it. Their defender is not stepping across the lane.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.4, 18],
        ["our-b", "B", "Left", 4.2, 15],
        ["our-c", "C", "High", 8.4, 13.2],
        ["our-d", "D", "Low", 10, 26]
      ]),
      opponents: opps([
        ["opp-gk", 1, "GK", 10, 2.3],
        ["opp-1", 5, "", 13.5, 8]
      ]),
      ball: { x: 4.6, y: 15 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "The pocket is free and B can see it. C’s job is to arrive there.",
      explanation: "C shows in 14 so B has a forward pass, not another square ball. We gain a receiver between their defenders. If C stays deep, B’s only options are safe and slow, and the pin never arrives.",
      coachingCue: "Show, create, or clear.",
      animationSteps: [
        { type: "move", playerId: "our-c", to: { x: 10, y: 8 }, duration: 650, caption: "C arrives in 14" },
        { type: "pass", from: { x: 4.6, y: 15 }, to: { x: 10, y: 8.4 }, duration: 500, caption: "B plays him" },
        { type: "move", playerId: "our-c", to: { x: 10.4, y: 6.8 }, duration: 450, caption: "C turns toward goal" }
      ]
    }, choice("arrive", [
      ["arrive", "C arrives in 14 and shows for B"],
      ["stay", "C stays deep and lets B dribble alone"],
      ["crowd", "A, C, and D all run into the pocket"],
      ["boot", "B should kick it off them and chase"]
    ]), why("The lane is open. One arrival gives B a forward pass.", "Leaving 14 empty wastes the angle B has.", "Three players in the pocket is a crowd, not a job.")),

    Object.assign({
      id: "futsal-zone14-03",
      module: "futsal-zone14",
      chapter: "futsal-zone14",
      chapterTitle: "Zone 14",
      title: "The check is not useful",
      concept: "futsal-zone14",
      interactionType: "multiple-choice",
      prompt: "A checked into Zone 14. The passing lane is blocked, and he has not pulled a defender off anyone. What now?",
      seeIt: SEE + " A is in 14. A defender stands on the lane from D’s ball to A. No teammate got free because of the check.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10, 7.8],
        ["our-b", "B", "Left", 4.4, 18],
        ["our-c", "C", "Right", 15.6, 17],
        ["our-d", "D", "Low", 10, 24]
      ]),
      opponents: opps([["opp-1", 6, "", 10, 14]]),
      ball: { x: 10, y: 22.5 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "If you cannot be played and you did not move their defender, the pocket is not helping.",
      explanation: "A clears so someone else can arrive, or so D can play wide. Staying asks for a ball that cannot be played and gives them a free tackle if we force it. “A second or two” means don’t camp there — it is not a foul for staying an extra touch when you are actually dangerous. Here, A is not.",
      coachingCue: "Arrive in 14. Don’t live in 14.",
      animationSteps: [{ type: "move", playerId: "our-a", to: { x: 15.2, y: 14 }, duration: 650, caption: "A clears. The pocket is free for the next check." }]
    }, choice("clear", [
      ["clear", "A clears out. He is not a pass and he did not drag anyone"],
      ["demand", "A stays and demands the ball through the defender"],
      ["join", "B and C join A in 14"],
      ["clock", "A must leave because two seconds is a violation"]
    ]), why("No lane and no advantage. Clearing reopens the pocket.", "Forcing the blocked pass gives them the ball.", "There is no two-second rule. We leave because the check is useless.")),

    Object.assign({
      id: "futsal-zone14-04",
      module: "futsal-zone14",
      chapter: "futsal-zone14",
      title: "He received it — create",
      chapterTitle: "Zone 14",
      concept: "futsal-zone14",
      interactionType: "multiple-choice",
      prompt: "A has the ball in Zone 14, facing their goal, with a lane to shoot or slip. What does he do?",
      seeIt: SEE + " A has already received. The defender is not tight. A shooting or passing lane is open. This is no longer a “show and leave” moment.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10, 8],
        ["our-b", "B", "Left", 4.6, 16],
        ["our-c", "C", "Right", 15.2, 15],
        ["our-d", "D", "Low", 10, 22]
      ]),
      opponents: opps([
        ["opp-gk", 1, "GK", 10, 2.2],
        ["opp-1", 4, "", 14.5, 7]
      ]),
      ball: { x: 10, y: 9.1 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "He is on the ball and the advantage is live. Use it.",
      explanation: "Create: turn, combine, or shoot. Leaving now because of a made-up countdown throws away the chance we checked in to get. A backward pass is the choice when the lane is gone, not when he is facing their goal with time.",
      coachingCue: "Show, create, or clear.",
      animationSteps: [{ type: "move", playerId: "our-a", to: { x: 10.2, y: 5.6 }, duration: 500, caption: "A drives the advantage." }]
    }, choice("create", [
      ["create", "Create — turn, combine, or shoot"],
      ["leave", "Leave immediately. Two seconds is up"],
      ["back", "Pass backward without looking at the goal"],
      ["wait", "Stand and wait for a second defender to arrive"]
    ]), why("He has the ball and a lane. That is the advantage.", "We do not punish a useful reception with a countdown.", "Ignoring the goal to go backward gives the chance back.")),

    Object.assign({
      id: "futsal-zone14-05",
      module: "futsal-zone14",
      chapter: "futsal-zone14",
      chapterTitle: "Zone 14",
      title: "Second arrival",
      concept: "futsal-zone14",
      interactionType: "multiple-choice",
      prompt: "A is already in Zone 14. B is arriving from the right. What should the picture become?",
      seeIt: SEE + " A occupies 14. B is checking in from the right, so the right side is about to be empty. C is left. D is low.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10, 7.8],
        ["our-b", "B", "Arriving", 13.4, 12],
        ["our-c", "C", "Left", 4.4, 18],
        ["our-d", "D", "Low", 10, 26]
      ]),
      ball: { x: 10, y: 20 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "Two players do not share the pocket. Someone leaves toward the space the arrival opened.",
      explanation: "B’s arrival starts an exchange: A clears to the right B is leaving, and C and D check whether they still hold their jobs. Usually they stay. If both A and B remain in 14, the right disappears and the pass into the pocket is now two players on one defender.",
      coachingCue: "Second man in: exchange.",
      animationSteps: [
        {
          type: "parallel",
          duration: 800,
          caption: "B arrives in 14. A clears to the right.",
          steps: [
            { type: "move", playerId: "our-b", to: { x: 10, y: 8 }, duration: 700 },
            { type: "move", playerId: "our-a", to: { x: 15.6, y: 16 }, duration: 700 }
          ]
        },
        { type: "highlight", playerIds: ["our-c", "our-d"], caption: "C and D reassess. They do not both sprint in." }
      ]
    }, choice("exchange", [
      ["exchange", "A clears to the right. B takes 14. C and D reassess"],
      ["share", "A and B both stay in 14"],
      ["everyone", "C and D also run into the pocket"],
      ["freeze", "A refuses to move because he got there first"]
    ]), why("One pocket, one player. A repairs the width B left.", "Sharing 14 deletes the right side.", "The other two already have jobs unless a new hole appears.")),

    Object.assign({
      id: "futsal-r01",
      module: "futsal-rotation",
      chapter: "futsal-rotation",
      chapterTitle: "Rotation",
      title: "Order the exchange",
      concept: "futsal-rotation",
      interactionType: "ordered-decision",
      prompt: "A is about to check from the right into Zone 14. Put the rotation in order.",
      seeIt: SEE + " Start picture: A right, B left, C high but narrow, D low. This rep starts with A. Another rep could start with someone else.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.6, 16],
        ["our-b", "B", "Left", 4.4, 18],
        ["our-c", "C", "High", 11.5, 11],
        ["our-d", "D", "Low", 10, 26]
      ]),
      ball: { x: 10, y: 22 },
      zones: [ZONE14],
      showTeachingZones: true,
      sequence: [
        { id: "arrive", label: "A arrives in Zone 14" },
        { id: "clear", label: "C clears out of the central space to the open right" },
        { id: "rebalance", label: "B and D hold or adjust so width and depth are still there" }
      ],
      correctOrder: ["arrive", "clear", "rebalance"],
      correctAnswer: "arrive,clear,rebalance",
      hint: "Someone enters, the player in the way leaves, then the others check the holes.",
      explanation: "A’s check is the entry. C must not stand on top of him, so C takes the right A left. B and D then rebalance — often by staying. If we rebalance before anyone arrives, we are moving without a reason. If nobody clears, 14 is clogged.",
      coachingCue: "One in, one out, then rebalance.",
      animationSteps: [
        { type: "move", playerId: "our-a", to: { x: 10, y: 8 }, duration: 700, caption: "A arrives in 14" },
        { type: "move", playerId: "our-c", to: { x: 15.6, y: 16 }, duration: 700, caption: "C clears to the right" },
        { type: "pass", from: { x: 10, y: 22 }, to: { x: 10, y: 9 }, duration: 500, caption: "The ball follows the new picture" }
      ]
    }, why("Enter, vacate, then make sure the four jobs still exist.", "Moving the far players first is motion without a picture.", "Leaving C in the pocket with A deletes the pass.")),

    Object.assign({
      id: "futsal-r02",
      module: "futsal-rotation",
      chapter: "futsal-rotation",
      chapterTitle: "Rotation",
      title: "They tracked the check",
      concept: "futsal-rotation",
      interactionType: "multiple-choice",
      prompt: "A checked into 14 and their defender followed him. A lane opened for B. What is the pass?",
      seeIt: SEE + " The defender who stepped with A left space behind him. B can arrive into that lane. C is right. D has the ball.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10.4, 8],
        ["our-b", "B", "Left", 5.2, 14],
        ["our-c", "C", "Right", 15.5, 17],
        ["our-d", "D", "Low", 10, 23]
      ]),
      opponents: opps([["opp-1", 5, "", 11.6, 10.5]]),
      ball: { x: 10, y: 21.5 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "The tracker created a new free player. Play that player.",
      explanation: "B is the third-player run. We gained a free lane because they followed A. Feeding A again plays the ball into the defender who is already there. The point of the check was the space it opened, not a permanent home for A.",
      coachingCue: "They follow the check. Play the free player.",
      animationSteps: [
        { type: "move", playerId: "our-b", to: { x: 7.2, y: 8.5 }, duration: 600, caption: "B attacks the lane they left" },
        { type: "pass", from: { x: 10, y: 21.5 }, to: { x: 7.4, y: 9.2 }, duration: 500, caption: "D plays B, not the covered check" }
      ]
    }, choice("third", [
      ["third", "Play B into the lane the tracker left"],
      ["force-a", "Keep passing into A, who is now marked"],
      ["spin", "Everyone rotate once more before the pass"],
      ["back", "Ignore B and pass only to the keeper"]
    ]), why("The defender’s step freed B. That is the advantage.", "A is the player they are now on.", "Another full spin wastes the open lane.")),

    Object.assign({
      id: "futsal-r03",
      module: "futsal-rotation",
      chapter: "futsal-rotation",
      chapterTitle: "Rotation",
      title: "They did not track",
      concept: "futsal-rotation",
      interactionType: "multiple-choice",
      prompt: "A is in Zone 14 and their defender did not follow. D can pass to him. What do we do?",
      seeIt: SEE + " A is free in 14. The nearest defender has stayed deep. B is left, C is right, D has the ball.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10, 8],
        ["our-b", "B", "Left", 4.5, 17],
        ["our-c", "C", "Right", 15.5, 17],
        ["our-d", "D", "Low", 9, 22]
      ]),
      opponents: opps([
        ["opp-gk", 1, "GK", 10, 2.3],
        ["opp-1", 4, "", 10, 4.8]
      ]),
      ball: { x: 9, y: 20.5 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "If they don’t come with the check, the check is the pass.",
      explanation: "Play A and let him attack. An exchange now would move the free player out of the best space. We rotate to fix a problem or to create one for them. Here the problem is already theirs, because A is free.",
      coachingCue: "Lane is on? Stay and play.",
      animationSteps: [
        { type: "pass", from: { x: 9, y: 20.5 }, to: { x: 10, y: 8.6 }, duration: 500, caption: "D plays A" },
        { type: "move", playerId: "our-a", to: { x: 10.3, y: 5.8 }, duration: 500, caption: "A attacks. No needless exit." }
      ]
    }, choice("play-a", [
      ["play-a", "Play A. He receives and attacks"],
      ["clear-anyway", "Make A leave. We always exchange"],
      ["all-run", "B and C sprint into 14 with him"],
      ["hold", "Don’t pass forward. Keep it with D"]
    ]), why("A is free because they stayed. Use him.", "Clearing a free player in 14 gives the space back.", "The exchange is for when the check is covered or doubled.")),

    Object.assign({
      id: "futsal-r04",
      module: "futsal-rotation",
      chapter: "futsal-rotation",
      chapterTitle: "Rotation",
      title: "The passes are already there",
      concept: "futsal-rotation",
      interactionType: "multiple-choice",
      prompt: "The four jobs are filled and D has open passes to B and to C. Teammates are starting to jog out of their spots. What is the best choice?",
      seeIt: SEE + " Nothing is broken. Left, right, high, and low each have a player. The ball can already move.",
      players: ours([
        GK,
        ["our-a", "A", "High", 10, 10.4],
        ["our-b", "B", "Left", 4.4, 17],
        ["our-c", "C", "Right", 15.6, 17],
        ["our-d", "D", "Low", 10, 25]
      ]),
      ball: { x: 10, y: 23.4 },
      hint: "If the picture already connects, playing is the action.",
      explanation: "Stay and play. A rotation now would create the hole we don’t have. We gain a simple pass to width or to A. The risk of “everyone move” is a moving target and a lost angle, which is how teams give it away while looking organized.",
      coachingCue: "If it connects, play. Don’t spin."
    }, choice("stay", [
      ["stay", "Stay. Connect and play the open pass"],
      ["full-spin", "All four change jobs before the pass"],
      ["a-leaves", "A must clear  even though he is the high option"],
      ["dribble", "D dribbles at the nearest defender instead"]
    ]), why("The jobs and the lanes are already good.", "A full spin creates holes we then have to fix.", "Leaving a useful high player is motion without a gain.")),

    Object.assign({
      id: "futsal-k01",
      module: "futsal-keeper",
      chapter: "futsal-keeper",
      chapterTitle: "Keeper",
      title: "Release to the keeper",
      concept: "futsal-keeper",
      interactionType: "multiple-choice",
      prompt: "D is deep on the ball and a defender is on him. The keeper is free. What is the safe pass?",
      seeIt: SEE + " Pressure is on D. The keeper has an angle at his feet. This is a release, not a trick restart.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.2],
        ["our-a", "A", "Right", 15.4, 20],
        ["our-b", "B", "Left", 4.6, 20],
        ["our-c", "C", "High", 10, 12],
        ["our-d", "D", "Low", 10, 28]
      ]),
      opponents: opps([["opp-1", 8, "", 10, 25.2]]),
      ball: { x: 10, y: 27 },
      hint: "The pressed player needs a free teammate behind the ball. That is the keeper.",
      explanation: "Play the keeper’s feet, then he looks for the open outlet. Turning into the press loses it in our half. A hopeful kick down the middle skips the free player we already have. We are not inventing a special back-pass rule here — if your league limits the keeper’s next touch, he still chooses the simple outlet.",
      coachingCue: "Pressed? Keeper’s feet."
    }, choice("gk", [
      ["gk", "Play the keeper’s feet"],
      ["turn", "D turns into the defender"],
      ["long", "Kick it long down the middle"],
      ["crowd", "Call A, B, and C back onto D"]
    ]), why("The keeper is the free player behind the pressure.", "Turning into a marker is how the counter starts.", "A long kick gives away the possession we could have kept.")),

    Object.assign({
      id: "futsal-k02",
      module: "futsal-keeper",
      chapter: "futsal-keeper",
      chapterTitle: "Keeper",
      title: "Which outlet?",
      concept: "futsal-keeper",
      interactionType: "multiple-choice",
      prompt: "The keeper has the ball. C is high and pinning. Which outlet does he play?",
      seeIt: SEE + " B is free on the left with a clean angle. A defender is tight on A on the right. C’s pin keeps a defender honest high.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 35.5],
        ["our-a", "A", "Right", 15.8, 22],
        ["our-b", "B", "Left", 4.2, 20],
        ["our-c", "C", "High", 10, 10],
        ["our-d", "D", "Low", 8, 28]
      ]),
      opponents: opps([["opp-1", 2, "", 15.2, 20]]),
      ball: { x: 10, y: 34.2 },
      hint: "Play the side that does not have a defender standing on the outlet.",
      explanation: "The left is the better exit. C’s job is to stay high and pin, not to receive a 30-meter ball through the middle. Playing A plays their defender. We keep the ball and still have height.",
      coachingCue: "Then the open outlet.",
      animationSteps: [{ type: "pass", from: { x: 10, y: 34.2 }, to: { x: 4.6, y: 20.4 }, duration: 550, caption: "Keeper plays the open left." }]
    }, choice("left", [
      ["left", "The free left outlet. C keeps the pin"],
      ["right", "A, even though a defender is on him"],
      ["middle", "A driven pass into the center"],
      ["c-only", "Only a long ball to C, every time"]
    ]), why("B is free. C is already doing the high job by pinning.", "The right outlet is marked.", "A hopeful middle pass skips the open player.")),

    Object.assign({
      id: "futsal-k03",
      module: "futsal-keeper",
      chapter: "futsal-keeper",
      chapterTitle: "Keeper",
      title: "Don’t force the middle",
      concept: "futsal-keeper",
      interactionType: "multiple-choice",
      prompt: "The keeper has the ball. Two defenders are jumping the central lane. What does he choose?",
      seeIt: SEE + " The middle toward 14 is crowded. Wide players are still possible, and the goal behind him is the risk if he loses it.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 35.8],
        ["our-a", "A", "Right", 16, 24],
        ["our-b", "B", "Left", 4, 24],
        ["our-c", "C", "High", 10, 16],
        ["our-d", "D", "Low", 10, 29]
      ]),
      opponents: opps([
        ["opp-1", 6, "", 8.5, 30],
        ["opp-2", 8, "", 12, 28]
      ]),
      ball: { x: 10.4, y: 34.6 },
      hint: "A pass he cannot afford to miss is not the brave pass.",
      explanation: "He protects the goal and plays a safer wide ball or holds until an angle is real. Dribbling out as a fifth attacker into that middle is how a goalkeeper pass becomes a chance for them. Ambition is for when the lane is actually open.",
      coachingCue: "Keeper keeps the goal safe first."
    }, choice("safe", [
      ["safe", "Play safe and wide, or hold. Don’t force the middle"],
      ["drive", "Dribble into the center as an extra outfielder"],
      ["through", "Pass between the two jumping defenders"],
      ["c-anyway", "Hit C even though the lane is crowded"]
    ]), why("The central lane is a trap. A simple outlet keeps the goal safe.", "The keeper entering that middle gives them a free counter.", "Forcing C through two players is a 50/50 in our half.")),

    Object.assign({
      id: "futsal-k04",
      module: "futsal-keeper",
      chapter: "futsal-keeper",
      chapterTitle: "Keeper",
      title: "Don’t all run to him",
      concept: "futsal-keeper",
      interactionType: "multiple-choice",
      prompt: "We just played the keeper. A, B, C, and D are all starting toward him. What has to happen?",
      seeIt: SEE + " The keeper has the ball. The four outfielders are collapsing toward our goal instead of holding jobs.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 35.5],
        ["our-a", "A", "Coming", 12, 32],
        ["our-b", "B", "Coming", 8, 31],
        ["our-c", "C", "Coming", 11, 28],
        ["our-d", "D", "Coming", 9.5, 30]
      ]),
      ball: { x: 10, y: 34 },
      hint: "He needs outlets in different spaces, not four players on his toes.",
      explanation: "They rebalance into high, low, left, and right. The keeper cannot pass to a crowd. If everyone comes to him we are easy to press, and the counter has the whole court in front of it when we lose it.",
      coachingCue: "Don’t all run to the keeper.",
      animationSteps: [
        {
          type: "parallel",
          duration: 850,
          caption: "Back to four jobs. The keeper keeps an outlet.",
          steps: [
            { type: "move", playerId: "our-c", to: { x: 10, y: 11 }, duration: 800 },
            { type: "move", playerId: "our-b", to: { x: 4.3, y: 18 }, duration: 800 },
            { type: "move", playerId: "our-a", to: { x: 15.7, y: 18 }, duration: 800 },
            { type: "move", playerId: "our-d", to: { x: 10, y: 26 }, duration: 800 }
          ]
        }
      ]
    }, choice("spread", [
      ["spread", "Rebalance to high, low, left, and right"],
      ["stack", "All four check to the keeper’s feet"],
      ["line", "Stand in a flat line on the ball"],
      ["high-gk", "Send the high player back next to the keeper too"]
    ]), why("Outlets have to be apart or the keeper has no pass.", "A crowd at his feet is a press and a counter.", "Pulling height all the way back removes the pin.")),

    Object.assign({
      id: "futsal-a01",
      module: "futsal-finish",
      chapter: "futsal-finish",
      chapterTitle: "Finish",
      title: "Facing their goal",
      concept: "futsal-finish",
      interactionType: "multiple-choice",
      prompt: "A received in Zone 14 facing their goal, with a lane. What is the first choice?",
      seeIt: SEE + " A is on the ball, body toward the top goal. The shot or a drive is on. D is low if he needs help. He does not need help yet.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10, 8],
        ["our-b", "B", "Left", 4.6, 16],
        ["our-c", "C", "Right", 15.4, 16],
        ["our-d", "D", "Low", 10, 22]
      ]),
      opponents: opps([["opp-gk", 1, "GK", 10, 2.2]]),
      ball: { x: 10, y: 9 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "The advantage is in front of him. Use it before you invent another pass.",
      explanation: "Drive or shoot. An automatic pass backward gives their keeper and defenders time we already earned. We go backward when the forward action is closed, not as a habit.",
      coachingCue: "Finish the advantage."
    }, choice("shoot", [
      ["shoot", "Drive or shoot"],
      ["back", "Automatic pass back to D"],
      ["extra", "Wait for another full rotation first"],
      ["wide-only", "Ignore the lane and only look wide"]
    ]), why("He is facing the goal with a lane. That is the finish.", "A backward pass gives the chance away.", "Another rotation delays a shot that is already there.")),

    Object.assign({
      id: "futsal-a02",
      module: "futsal-finish",
      chapter: "futsal-finish",
      chapterTitle: "Finish",
      title: "The check pulled a defender",
      concept: "futsal-finish",
      interactionType: "multiple-choice",
      prompt: "A’s touch in 14 pulled a defender off B. What is the combination?",
      seeIt: SEE + " Their defender stepped from B onto A. B is now the free player on the left of the pocket. D has a pass to B.",
      players: ours([
        GK,
        ["our-a", "A", "In 14", 10.6, 8.2],
        ["our-b", "B", "Left", 6.2, 12],
        ["our-c", "C", "Right", 15.6, 18],
        ["our-d", "D", "Low", 10, 20]
      ]),
      opponents: opps([["opp-1", 5, "", 12, 9.5]]),
      ball: { x: 10.2, y: 18.6 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "Watch who the defender left, not only who has the check.",
      explanation: "Play B, the third player. A’s job was to drag the defender, and it worked. Shooting straight into the defender who stepped, or rotating away from B, spends the advantage on the wrong player.",
      coachingCue: "They step, you slip it.",
      animationSteps: [
        { type: "pass", from: { x: 10.2, y: 18.6 }, to: { x: 6.6, y: 12.2 }, duration: 480, caption: "The pass goes to the player they left" },
        { type: "move", playerId: "our-b", to: { x: 7.4, y: 8 }, duration: 500, caption: "B attacks the gap" }
      ]
    }, choice("third", [
      ["third", "Play B, the free third player"],
      ["into-def", "Shoot at the defender who stepped to A"],
      ["leave", "Rotate A and B both away from the gap"],
      ["hold", "Hold the ball until the defender recovers to B"]
    ]), why("The step freed B. The combination uses that.", "The defender is now on the shot.", "Leaving the free player wastes the drag.")),

    Object.assign({
      id: "futsal-a03",
      module: "futsal-finish",
      chapter: "futsal-finish",
      chapterTitle: "Finish",
      title: "Wide, with only four",
      concept: "futsal-finish",
      interactionType: "multiple-choice",
      prompt: "A has the ball on the right baseline. How do the other three attack it?",
      seeIt: SEE + " Ball is wide and deep on the right. We still need a far-post runner and a cutback, and we still need one player for security. We do not have a spare runner.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 17.2, 6.5],
        ["our-b", "B", "Cutback", 10, 10],
        ["our-c", "C", "Far", 6.2, 5.2],
        ["our-d", "D", "Low", 10, 22]
      ]),
      opponents: opps([["opp-gk", 1, "GK", 10, 2.4]]),
      ball: { x: 17.2, y: 5.4 },
      hint: "Far post and cutback can both be live. Someone does not join them.",
      explanation: "C attacks the far post. B is the cutback around the top of the box. D stays low so a tackle is not a breakaway. Sending D into the box too means four attackers and no security — outdoor near/far/cutback still applies, but one of those jobs is already the player on the ball.",
      coachingCue: "Far post and a cutback. Low stays.",
      animationSteps: [
        {
          type: "parallel",
          duration: 700,
          caption: "Far post and cutback. D holds.",
          steps: [
            { type: "move", playerId: "our-c", to: { x: 5.5, y: 3.6 }, duration: 600 },
            { type: "move", playerId: "our-b", to: { x: 10, y: 8.2 }, duration: 600 }
          ]
        }
      ]
    }, choice("two-plus", [
      ["two-plus", "Far post and a cutback. D stays for security"],
      ["all-three", "B, C, and D all crash the six-yard box"],
      ["near-only", "Everyone attacks the near post"],
      ["none", "Nobody runs. A crosses to an empty box"]
    ]), why("Two finishers plus the ball, and one player behind the play.", "All three joining leaves the counter open.", "An empty box wastes the wide ball.")),

    Object.assign({
      id: "futsal-a04",
      module: "futsal-finish",
      chapter: "futsal-finish",
      chapterTitle: "Finish",
      title: "The center is closed",
      concept: "futsal-finish",
      interactionType: "multiple-choice",
      prompt: "Their block is compact and Zone 14 is full of defenders. What do we do with the ball?",
      seeIt: SEE + " Two defenders are sitting in the central pocket. Wide space on the left is quieter. Forcing another player into 14 adds to the crowd.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 15.2, 16],
        ["our-b", "B", "Left", 4.2, 16],
        ["our-c", "C", "High", 12, 12],
        ["our-d", "D", "Low", 10, 24]
      ]),
      opponents: opps([
        ["opp-1", 4, "", 9, 8],
        ["opp-2", 5, "", 12, 8.4]
      ]),
      ball: { x: 14.6, y: 16 },
      zones: [ZONE14],
      showTeachingZones: true,
      hint: "When the middle is a wall, change the picture before you add a body to it.",
      explanation: "Move it across, then re-open a lane. B on the left can receive and the jobs reset. Jamming C into a closed 14 makes the pass they want. We attack the space that is left, not the space they have filled.",
      coachingCue: "Center closed? Change the side.",
      animationSteps: [{ type: "pass", from: { x: 14.6, y: 16 }, to: { x: 4.6, y: 16.4 }, duration: 550, caption: "Switch. Don’t add another player to 14." }]
    }, choice("switch", [
      ["switch", "Switch to the open side and rebuild the jobs"],
      ["jam", "Send another player into the crowded pocket"],
      ["shoot-block", "Shoot through the two defenders"],
      ["freeze", "Keep circulating into the same trap"]
    ]), why("The middle is taken. The other width is the new picture.", "An extra body in 14 helps their block.", "A shot into two defenders is a clearance for them.")),

    Object.assign({
      id: "futsal-d01",
      module: "futsal-diamond",
      chapter: "futsal-diamond",
      chapterTitle: "Diamond",
      title: "Who protects the middle?",
      concept: "futsal-diamond",
      interactionType: "multiple-choice",
      prompt: "We are in a 1-2-1. A, the front player, is ready to step. Who protects the middle behind him?",
      seeIt: SEE_DEF + " One front (A), two wide in the middle band (B and C), one central and deeper (D). That is a 1-2-1. Keeper is behind D.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 10, 17],
        ["our-b", "B", "Left", 6.2, 23.5],
        ["our-c", "C", "Right", 13.8, 23.5],
        ["our-d", "D", "Back", 10, 29.5]
      ]),
      opponents: opps([["opp-1", 9, "", 10, 12]]),
      ball: { x: 10, y: 13 },
      hint: "The front player pressures. The central player goal-side of him is the cover in the middle.",
      explanation: "D protects the middle. If A steps and D is not there, their pass splits us. B and C are the width of the diamond, not the central cover. Calling B the middle protector pulls the left side inside and opens the wide pass.",
      coachingCue: "Front pressures. The one behind protects the middle."
    }, choice("d", [
      ["d", "D — central, goal-side of the pressure"],
      ["b", "B — he should leave the left and become the cover"],
      ["gk", "Only the keeper. The diamond does not cover"],
      ["c-and-b", "Both wide players jump next to A"]
    ]), why("D is the central player behind the step.", "The wide players keep the diamond from becoming a line.", "The keeper is the last line, not the first cover.")),

    Object.assign({
      id: "futsal-d02",
      module: "futsal-diamond",
      chapter: "futsal-diamond",
      chapterTitle: "Diamond",
      title: "The ball goes wide",
      concept: "futsal-diamond",
      interactionType: "multiple-choice",
      prompt: "Their ball is on our left. How does the diamond move?",
      seeIt: SEE_DEF + " The ball is wide left. We are still a connected 1-2-1, not four separate markers.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 10, 18],
        ["our-b", "B", "Left", 6.4, 24],
        ["our-c", "C", "Right", 14, 24],
        ["our-d", "D", "Back", 10, 30]
      ]),
      opponents: opps([["opp-1", 7, "", 3.2, 20]]),
      ball: { x: 3.2, y: 18.6 },
      hint: "Slide the shape. Don’t send one player and leave the rest as a statue.",
      explanation: "The four shift toward the ball together: B delays, D and A squeeze the inside pass, C tucks but does not have to arrive on the touchline. If each player picks a body and chases, the middle — our Zone 14 — opens. A group shift keeps pressure and the center.",
      coachingCue: "Shift together. Don’t chase.",
      animationSteps: [
        {
          type: "parallel",
          duration: 750,
          caption: "The diamond slides left. It stays connected.",
          steps: [
            { type: "move", playerId: "our-b", to: { x: 4.6, y: 21 }, duration: 700 },
            { type: "move", playerId: "our-a", to: { x: 8, y: 17 }, duration: 700 },
            { type: "move", playerId: "our-d", to: { x: 8, y: 28 }, duration: 700 },
            { type: "move", playerId: "our-c", to: { x: 12.2, y: 23 }, duration: 700 }
          ]
        }
      ]
    }, choice("slide", [
      ["slide", "The diamond shifts toward the ball as one shape"],
      ["man", "Each player follows a different opponent"],
      ["only-b", "Only B goes wide. The other three do not move"],
      ["gk-out", "The keeper comes to the touchline"]
    ]), why("A connected slide keeps pressure and the middle.", "Four individual chases split the diamond.", "One player wide, three stuck, opens the inside pass.")),

    Object.assign({
      id: "futsal-d03",
      module: "futsal-diamond",
      chapter: "futsal-diamond",
      chapterTitle: "Diamond",
      title: "Where is the cover?",
      concept: "futsal-diamond",
      interactionType: "multiple-choice",
      prompt: "B steps from the left to the ball. Where should D be?",
      seeIt: SEE_DEF + " B is the pressure on the ball-side. D is the deeper central player. Cover is goal-side and inside, not shoulder-to-shoulder with B.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 9, 18],
        ["our-b", "B", "Step", 4.8, 20],
        ["our-c", "C", "Right", 13.6, 24],
        ["our-d", "D", "Back", 10, 29]
      ]),
      opponents: opps([["opp-1", 11, "", 3.4, 18]]),
      ball: { x: 3.6, y: 17.2 },
      hint: "If B is beaten, the next player should already be on the inside lane toward our goal.",
      explanation: "D slides toward the ball-side inside, behind B. That is cover. If D stands next to B, two players are on the ball and the middle is empty. If C jumps up beside B, the far side and the middle both go. One steps. One covers.",
      coachingCue: "Step, and have cover."
    }, choice("inside", [
      ["inside", "D covers inside and goal-side of B"],
      ["beside", "D stands next to B on the ball"],
      ["c-up", "C leaves the right and doubles next to B"],
      ["a-back", "A drops all the way to the keeper"]
    ]), why("Cover protects the next pass, behind the pressure.", "Two on the ball leaves the middle open.", "The far player is balance, not a second press.")),

    Object.assign({
      id: "futsal-d04",
      module: "futsal-diamond",
      chapter: "futsal-diamond",
      chapterTitle: "Diamond",
      title: "A wide decoy",
      concept: "futsal-diamond",
      interactionType: "multiple-choice",
      prompt: "Their player is wide with no angle to goal, trying to pull B out. What do we give up?",
      seeIt: SEE_DEF + " The wide player is on the touchline, not running at our box. If B goes to touch him, the pass inside to our Zone 14 is open.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 10, 18],
        ["our-b", "B", "Left", 6.5, 24],
        ["our-c", "C", "Right", 13.8, 24],
        ["our-d", "D", "Back", 10, 30]
      ]),
      opponents: opps([["opp-1", 7, "", 1.8, 22]]),
      ball: { x: 1.8, y: 20.5 },
      hint: "Ask what the wide player is trying to open. Then don’t open it.",
      explanation: "We can concede the harmless wide touch and stay connected. B shows him a body but does not leave the inside passing lane. Chasing him to the line is exactly the split they want, because 14 in front of our box becomes a free receive.",
      coachingCue: "Protect the middle. Width can wait."
    }, choice("stay-in", [
      ["stay-in", "Stay connected. Let the harmless wide ball be wide"],
      ["touch", "B goes to the touchline and leaves the inside"],
      ["all-wide", "The diamond follows him to the sideline"],
      ["gk-wide", "Keeper comes out to the wide player"]
    ]), why("The danger is the inside lane, not the touchline.", "Stepping all the way out opens 14.", "The keeper leaving for a wide decoy opens the goal.")),

    Object.assign({
      id: "futsal-d05",
      module: "futsal-diamond",
      chapter: "futsal-diamond",
      chapterTitle: "Diamond",
      title: "Ball at the top of our arc",
      concept: "futsal-diamond",
      interactionType: "multiple-choice",
      prompt: "Their ball is at the top of our penalty arc. How do we close it?",
      seeIt: SEE_DEF + " The threat is central, just outside our 6m arc. D is the closest. The other three are still in the diamond higher up the court.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 37.2],
        ["our-a", "A", "Front", 10, 22],
        ["our-b", "B", "Left", 6.4, 27],
        ["our-c", "C", "Right", 13.6, 27],
        ["our-d", "D", "Back", 11.2, 34.2]
      ]),
      opponents: opps([["opp-1", 10, "", 10, 32.4]]),
      ball: { x: 10, y: 31.2 },
      hint: "Close the lane with the nearest player who still has teammates behind the picture. Don’t empty the rest.",
      explanation: "D closes the access because he is there and the others still guard the next pass. If all four jump the ball, a layoff plays them. If nobody goes, they turn and shoot. One closes. The diamond does not collapse onto the keeper.",
      coachingCue: "Close it. Don’t all jump."
    }, choice("d-closes", [
      ["d-closes", "D closes the lane. The other three hold the diamond"],
      ["all-jump", "All four jump onto the ball"],
      ["all-gk", "Everyone drops onto the keeper and watches"],
      ["a-only", "Only A, the highest player, runs back from midfield alone"]
    ]), why("Nearest pressure, with the shape still behind him.", "Four on the ball leaves the layoff.", "A solo sprint from the front arrives late and uncovers nothing.")),

    Object.assign({
      id: "futsal-m01",
      module: "futsal-motion",
      chapter: "futsal-motion",
      chapterTitle: "In motion",
      title: "Press, cover, balance",
      concept: "futsal-motion",
      interactionType: "multiple-choice",
      prompt: "The ball is on our right in a 1-2-1. What are the jobs in this moment?",
      seeIt: SEE_DEF + " Still one front, two in the middle band, one back. Ball is right. C is nearest. D is central behind. B is the far side.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 10, 18],
        ["our-b", "B", "Left", 6.2, 24],
        ["our-c", "C", "Right", 13.8, 23],
        ["our-d", "D", "Back", 10, 30]
      ]),
      opponents: opps([["opp-1", 2, "", 16.4, 20]]),
      ball: { x: 16.6, y: 18.5 },
      hint: "Nearest delays. The central deep player covers. The far player does not come all the way across.",
      explanation: "C pressures or steers. D covers inside. B balances so a switch does not run free. A protects the forward pass through the middle. If B comes all the way to the ball, balance is gone. If nobody steps, they walk in.",
      coachingCue: "Pressure, cover, balance."
    }, choice("split-jobs", [
      ["split-jobs", "C delays the ball. D covers inside. B stays to balance"],
      ["all-right", "A, B, and D join C on the ball"],
      ["b-cross", "B sprints across and leaves the left empty"],
      ["no-step", "Nobody steps. We wait in a perfect plus sign"]
    ]), why("That is pressure, cover, and a far player who still matters.", "A pile on the ball opens the switch.", "Waiting in a rigid shape lets them play through us.")),

    Object.assign({
      id: "futsal-m02",
      module: "futsal-motion",
      chapter: "futsal-motion",
      chapterTitle: "In motion",
      title: "A tilted diamond",
      concept: "futsal-motion",
      interactionType: "multiple-choice",
      prompt: "The ball is on the sideline and our diamond is staggered, not a perfect plus. What do you do?",
      seeIt: SEE_DEF + " C is higher toward the right sideline ball. B is a little deeper. D is central. It is connected, just not symmetrical.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "Front", 8.5, 18],
        ["our-b", "B", "Left", 6, 26],
        ["our-c", "C", "Right", 14.5, 20],
        ["our-d", "D", "Back", 10.5, 30]
      ]),
      opponents: opps([["opp-1", 3, "", 17.4, 16]]),
      ball: { x: 17.6, y: 15 },
      hint: "The standard is the connections, not a drawing of a plus sign.",
      explanation: "Keep the tilt. We are already toward the ball, with cover and a far player. Stopping to “fix” a perfect plus lets them play while we organize a diagram. A flat square would be worse if it opens the central lane. Stagger is the point of choosing a diamond.",
      coachingCue: "Tilt is fine. Don’t reset for a picture."
    }, choice("keep", [
      ["keep", "Keep the stagger. It is already toward the ball"],
      ["plus", "Everyone freeze and rebuild a perfect plus before defending"],
      ["flat", "Drop into a flat square line"],
      ["chase-line", "C goes to the touchline alone"]
    ]), why("The stagger still has pressure, cover, and balance.", "A perfect plus is not the rule.", "Flattening opens the middle the diamond is for.")),

    Object.assign({
      id: "futsal-m03",
      module: "futsal-motion",
      chapter: "futsal-motion",
      chapterTitle: "In motion",
      title: "Three deeper — a 1-3",
      concept: "futsal-motion",
      interactionType: "multiple-choice",
      prompt: "Count the bands. Why are three players deeper toward our goal?",
      seeIt: SEE_DEF + " One player, A, is higher. B, C, and D are in a deeper band. C is goalside of a far-post run. This picture is a 1-3, front to back. It is not our permanent name.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 37],
        ["our-a", "A", "Screen", 10, 22],
        ["our-b", "B", "Deep", 5.6, 30],
        ["our-d", "D", "Deep", 10, 31.5],
        ["our-c", "C", "Deep", 14.6, 30]
      ]),
      opponents: opps([
        ["opp-1", 9, "", 8, 26],
        ["opp-2", 11, "", 15.5, 28]
      ]),
      ball: { x: 8, y: 25 },
      hint: "Look at where the ball and the far-post runner are, then count who is goal-side of that.",
      explanation: "The goal is threatened, so three protect that depth and the far post. A stays higher to screen the next pass so we are not all standing on the keeper. Calling this a high press would be false — most of the team is deep. Sending the three up would uncover the run we dropped for.",
      coachingCue: "Count the bands. This one is a 1-3."
    }, choice("protect-depth", [
      ["protect-depth", "The goal and the far-post run need depth. A still screens"],
      ["high-press", "This is a high press because we always call three players a press"],
      ["push-up", "The three deep players should step up next to A"],
      ["ignore-post", "C should leave the far-post runner"]
    ]), why("Three are deep because the danger is deep. One still screens.", "The numbers are not a high press in this picture.", "Stepping the three up uncovers the run.")),

    Object.assign({
      id: "futsal-m04",
      module: "futsal-motion",
      chapter: "futsal-motion",
      chapterTitle: "In motion",
      title: "Three higher — a 3-1",
      concept: "futsal-motion",
      interactionType: "multiple-choice",
      prompt: "We can press. Three are in the higher band. Why does D stay behind them?",
      seeIt: SEE_DEF + " B, A, and C are higher, toward their ball. D is the only one behind that line. Front to back, this picture is a 3-1.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.6],
        ["our-b", "B", "High", 5.2, 16.5],
        ["our-a", "A", "High", 10, 14.5],
        ["our-c", "C", "High", 14.8, 16.5],
        ["our-d", "D", "Behind", 10, 24]
      ]),
      opponents: opps([["opp-1", 8, "", 10, 10]]),
      ball: { x: 10, y: 9 },
      hint: "A press without someone behind it is just four players high.",
      explanation: "D protects the pass that breaks the press. The three can step because that escape is guarded. If D joins the line, one ball over them is a goal. The label 3-1 matches this picture only: three higher, one behind. It is not “we always high-press.”",
      coachingCue: "Someone protects the escape.",
      animationSteps: [
        {
          type: "parallel",
          duration: 700,
          caption: "Three squeeze. D stays the protector.",
          steps: [
            { type: "move", playerId: "our-a", to: { x: 10, y: 12.5 }, duration: 600 },
            { type: "move", playerId: "our-b", to: { x: 6.5, y: 14.5 }, duration: 600 },
            { type: "move", playerId: "our-c", to: { x: 13.5, y: 14.5 }, duration: 600 }
          ]
        }
      ]
    }, choice("protect", [
      ["protect", "D guards the ball in behind the press"],
      ["join", "D steps up so all four are in one high line"],
      ["wide", "D marks a player on the touchline and leaves the center"],
      ["gk-press", "The keeper replaces D in the press"]
    ]), why("The three-step only works if the escape is covered.", "A flat four is a ball over the top.", "The protector’s job is central, not a wide mark.")),

    Object.assign({
      id: "futsal-t01",
      module: "futsal-transitions",
      chapter: "futsal-transitions",
      chapterTitle: "Transitions",
      title: "Lose it — we are close",
      concept: "futsal-transition",
      interactionType: "multiple-choice",
      prompt: "We just lost the ball. A is on it and D is goal-side, close enough to help. What do we do?",
      seeIt: SEE_DEF + " The loose ball is still in our crowd. Cover is already there. This is not a breakaway.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.6],
        ["our-a", "A", "Near", 10, 16],
        ["our-b", "B", "Left", 6, 18],
        ["our-c", "C", "Right", 14, 18],
        ["our-d", "D", "Cover", 10, 21]
      ]),
      opponents: opps([["opp-1", 6, "", 11, 15]]),
      ball: { x: 10.6, y: 15.4 },
      hint: "Numbers around the ball, and a player behind the pressure. Squeeze.",
      explanation: "Counterpress. A delays, D covers, B and C squeeze the exits. If we drop off here they play out of the crowd for free. If A dives in with nobody behind him, that would be a foul chase — but D is there.",
      coachingCue: "Close and covered? Counterpress."
    }, choice("press", [
      ["press", "Counterpress together. A delays, D covers"],
      ["drop", "Everyone retreats and lets them play"],
      ["a-alone", "A jumps in alone. The others watch"],
      ["gk-sprint", "The keeper sprints out to the ball"]
    ]), why("We are close and the cover is already in place.", "Retreating gives them an easy exit.", "A solo jump with no cover is a spin.")),

    Object.assign({
      id: "futsal-t02",
      module: "futsal-transitions",
      chapter: "futsal-transitions",
      chapterTitle: "Transitions",
      title: "Lose it — they are out",
      concept: "futsal-transition",
      interactionType: "multiple-choice",
      prompt: "We lost it high. Their player is facing our goal with space, and our four are still up the court. What now?",
      seeIt: SEE_DEF + " We are stretched. They have a free player toward our goal. Immediate pressure is a one-man chase.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.8],
        ["our-a", "A", "High", 8, 10],
        ["our-b", "B", "High", 4.5, 12],
        ["our-c", "C", "High", 15, 12],
        ["our-d", "D", "High", 12, 14]
      ]),
      opponents: opps([["opp-1", 9, "", 10, 20]]),
      ball: { x: 10, y: 18.8 },
      hint: "They are facing our goal and we are not behind the ball. That is a recovery.",
      explanation: "Recover into the diamond, D goal-side first. A counterpress here is one player running at a free ball with three teammates still in attack. We contract, then we can defend. Chasing from in front of the ball arrives too late and leaves the middle.",
      coachingCue: "They’re out? Recover.",
      animationSteps: [
        {
          type: "parallel",
          duration: 850,
          caption: "Recover. D gets goal-side. The diamond comes back.",
          steps: [
            { type: "move", playerId: "our-d", to: { x: 10, y: 30 }, duration: 800 },
            { type: "move", playerId: "our-b", to: { x: 6.2, y: 24 }, duration: 800 },
            { type: "move", playerId: "our-c", to: { x: 13.8, y: 24 }, duration: 800 },
            { type: "move", playerId: "our-a", to: { x: 10, y: 18 }, duration: 800 }
          ]
        }
      ]
    }, choice("recover", [
      ["recover", "Recover. D gets goal-side and we rebuild the diamond"],
      ["chase", "The nearest player hunts alone"],
      ["stay-high", "Stay high and hope they miss"],
      ["gk-half", "Keeper runs to halfway"]
    ]), why("We are stretched and they face our goal. Cover is not there.", "A solo chase does not put anyone goal-side.", "Staying high leaves the keeper one-on-one.")),

    Object.assign({
      id: "futsal-t03",
      module: "futsal-transitions",
      chapter: "futsal-transitions",
      chapterTitle: "Transitions",
      title: "Win it — they’re open",
      concept: "futsal-transition",
      interactionType: "multiple-choice",
      prompt: "We just won the ball. B is free, facing their goal, and their shape is split. First look?",
      seeIt: SEE + " The regain is ours. B has space toward the top goal. This is the forward picture, not a slow restart.",
      players: ours([
        GK,
        ["our-a", "A", "Right", 14, 20],
        ["our-b", "B", "Free", 7, 14],
        ["our-c", "C", "High", 12, 18],
        ["our-d", "D", "Low", 10, 24]
      ]),
      opponents: opps([["opp-1", 4, "", 15, 10]]),
      ball: { x: 10, y: 22 },
      hint: "First look is the open space toward their goal.",
      explanation: "Play B. We won it while they are open, so the attack is the pass that is already on. Holding to “get into a shape” first lets them recover the diamond we should be attacking. Expand only when that forward pass is not there.",
      coachingCue: "Win it and look forward.",
      animationSteps: [{ type: "pass", from: { x: 10, y: 22 }, to: { x: 7.2, y: 13.2 }, duration: 480, caption: "First pass is the free player toward goal." }]
    }, choice("forward", [
      ["forward", "Play B into the open space toward their goal"],
      ["shape-first", "Pause and walk into a perfect shape"],
      ["keeper-first", "Pass back to the keeper before looking forward"],
      ["sideways", "Only a square pass, even though B is free"]
    ]), why("The forward player is free. That is the first look.", "Stopping to draw a shape gives them time.", "Going backward ignores an open goal-side pass.")),

    Object.assign({
      id: "futsal-t04",
      module: "futsal-transitions",
      chapter: "futsal-transitions",
      chapterTitle: "Transitions",
      title: "Win it — the way forward is shut",
      concept: "futsal-transition",
      interactionType: "multiple-choice",
      prompt: "We won the ball, but the forward lane is blocked. What is the build?",
      seeIt: SEE + " A defender is on the high pass. Width and the keeper are still available. We are not in a break.",
      players: ours([
        ["our-gk", "GK", "GK", 10, 36.4],
        ["our-a", "A", "Right", 15.5, 20],
        ["our-b", "B", "Left", 4.5, 20],
        ["our-c", "C", "High", 10, 14],
        ["our-d", "D", "Low", 10, 26]
      ]),
      opponents: opps([["opp-1", 6, "", 10, 18]]),
      ball: { x: 10, y: 25 },
      hint: "Can’t go forward yet. Spread the four jobs. The keeper is allowed to help.",
      explanation: "Expand: high stays a pin, left and right give angles, low or the keeper keeps it. Forcing the ball into the blocked lane turns a regain into a loss. The keeper is there if D is pressed while we find the width. We do not need a set play to start.",
      coachingCue: "If it’s not on, expand. Keeper can help."
    }, choice("expand", [
      ["expand", "Restore high, low, left, and right. Use the keeper if D is pressed"],
      ["force", "Force the pass through the defender into C"],
      ["boot", "Kick it long and chase"],
      ["camp", "All four stand still on the ball"]
    ]), why("The forward lane is closed, so we connect the four jobs.", "Forcing C plays their defender.", "A boot gives away the regain."))
  ].map((s) => Object.assign({ phase: "learn", challengeEligible: true }, s));

  window.CfcFutsalIQ = {
    CONFIG,
    GLOSSARY,
    NAV_GROUPS,
    MODULES,
    SCENARIOS
  };
})();
