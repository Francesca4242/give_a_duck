/* All the words. Every list has a `clean` half and a `cheeky` half.
   Cheeky mode = clean + cheeky. Clean mode = clean only. */
(function () {
  // Shared by the browser (window.App.content) and the Worker (globalThis.GAD_CONTENT).
  const G = typeof window !== "undefined" ? window : globalThis;
  const C = (G.App = G.App || {}).content = {};
  G.GAD_CONTENT = C;

  C.quips = [
    "I don't give a duck.",
    "What the duck?",
    "Quack.",
    "Ducking brilliant.",
    "Get in, loser. We're going to the pond.",
    "Ducks have no nerves in their feet. Respect.",
    "I'm not mad, I'm just quacked off.",
    "Bread is not good for us. Give it anyway.",
    "Tap me again. I dare you.",
    "Mother ducker.",
    "This pond ain't big enough for the both of us.",
    "Keep calm and waddle on.",
    "Feathers? Fluffed. Ready.",
    "Somebody's getting goosed tonight.",
    "Nice tail feathers.",
  ];

  C.teamNames = [
    "The Mallards", "Quackheads", "Bill Collectors", "Down Feathers",
    "The Pond Scum", "Waddle Squad", "Peking Disorder", "The Lame Ducks",
    "Fowl Mouths", "Sitting Ducks", "Duck Dynasty-ish", "The Ugly Ducklings",
  ];

  /* ---------- Duck in a Hat suggestions ---------- */
  C.hat = {
    clean: [
      "Gordon Ramsay", "Beyoncé", "Shrek", "Dolly Parton", "Elvis", "Gandalf",
      "Mr Bean", "David Attenborough", "Darth Vader", "Santa Claus", "Cleopatra",
      "Napoleon", "Shakespeare", "The Spice Girls", "Taylor Swift", "Batman",
      "Bread", "Rubber duck", "Duck à l'orange", "Lame duck", "Sitting duck",
      "Wild goose chase", "Goosebumps", "Swan Lake", "Karaoke", "IKEA",
      "Tax return", "The Hokey Cokey", "Moustache", "Sunburn", "The friend zone",
      "Fake tan", "Wedgie", "The conga", "Bouncy castle", "Toilet roll",
      "Socks and sandals", "Mid-life crisis", "Selfie stick", "Traffic cone",
      "Pub quiz", "Garden gnome", "Glitter", "Bagpipes", "Escalator",
      "Group chat", "Haunted house", "Pineapple on pizza", "Dad dancing",
      "A wasp at a picnic", "Gravy", "Sat nav", "Tamagotchi", "Bingo",
    ],
    cheeky: [
      "Skinny dipping", "Walk of shame", "Mankini", "Spanx", "Beer goggles",
      "Nipple tassels", "Booty call", "Hangover", "Stag do", "Hen do",
      "Hot tub", "Nudist beach", "Love bite", "Lap dance", "Twerking",
      "The birds and the bees", "Strip poker", "Tinder date", "Pole dancing",
      "Fifty Shades of Grey", "Edible underwear", "Body shots", "Thong",
      "Morning after", "Speed dating", "Sexy firefighter calendar",
      "Woodpecker", "Cockatoo", "Blue-footed booby", "Great tit",
    ],
  };

  /* ---------- Scrawl-ack starter prompts ---------- */
  C.scrawl = {
    clean: [
      "A duck at a job interview", "Ducks robbing a bank",
      "A duck stuck in a revolving door", "It's raining bread",
      "A duckling's first day at school", "A goose doing your tax audit",
      "A swan who thinks it's better than everyone", "A duck DJ at a rave",
      "A rubber duck's mid-life crisis", "A duck on a wild goose chase",
      "Ducks forming a boy band", "A duck that has seen things",
      "Duck yoga", "A duck getting a terrible haircut",
      "The world's smallest pond", "A pigeon pretending to be a duck",
      "A duck winning an Oscar", "A goose holding someone hostage",
      "Grandma riding a duck into battle", "A duck at the dentist",
      "Ducks queuing for the toilet", "A duck who can't swim",
    ],
    cheeky: [
      "A duck's dodgy dating profile picture", "A duck at a nudist beach",
      "A goose goosing someone", "The walk of shame back to the pond",
      "A duck doing a striptease out of its feathers", "Tail feathers twerking",
      "A duck's stag do in Magaluf", "Skinny dipping in the pond",
      "A duck wearing beer goggles", "Hen party at the pond",
      "Waking up next to a swan", "A duck's spicy calendar shoot",
      "A woodpecker with a massive pecker", "Two ducks in a hot tub",
      "A duck sexting with emojis", "A duck doing the walk of fame",
      "Caught with your feathers down", "A duck getting a love bite",
      "A very cheeky cockatoo", "Speed dating for ducks",
    ],
  };

  /* ---------- Duck Duck Goose: categories ---------- */
  C.goose = {
    clean: {
      "Pond Life": ["Frog", "Lily pad", "Swan", "Heron", "Tadpole", "Fishing rod", "Bread", "Reeds", "Dragonfly", "Rowing boat", "Algae", "Pike"],
      "Night Out": ["Kebab", "Tequila", "Bouncer", "Karaoke", "Taxi", "Hangover", "Dance floor", "Toilet queue", "Glitter", "Heels", "Club stamp", "Last orders"],
      "Food": ["Pizza", "Sushi", "Banana", "Croissant", "Lasagne", "Taco", "Cheese board", "Doughnut", "Roast dinner", "Curry", "Crumpet", "Fish fingers"],
      "Places": ["Airport", "Gym", "Sauna", "Wedding", "Hospital", "Library", "Zoo", "Prison", "Theme park", "Campsite", "Supermarket", "Cinema"],
      "Jobs": ["Pilot", "Dentist", "Clown", "Lifeguard", "Plumber", "Magician", "Teacher", "Butcher", "Astronaut", "Lollipop lady", "Spy", "Vet"],
      "Christmas": ["Mistletoe", "Cracker", "Sprouts", "Reindeer", "Tinsel", "Elf", "Stocking", "Snowman", "Mince pie", "Nativity", "Advent calendar", "Bauble"],
      "At the Beach": ["Sandcastle", "Seagull", "Sunscreen", "Lilo", "Ice cream", "Crab", "Deckchair", "Surfboard", "Pier", "Jellyfish", "Flip-flops", "Donkey ride"],
    },
    cheeky: {
      "After Dark": ["Handcuffs", "Love bite", "Waterbed", "Lingerie", "Hot tub", "Massage oil", "Blindfold", "Skinny dip", "Booty call", "Walk of shame", "Strip poker", "Whipped cream"],
      "Hen & Stag": ["Inflatable willy", "L-plates", "Stripper", "Sash", "Tiara", "Pub crawl", "Shots", "Fancy dress", "Best man", "Magaluf", "Veil", "Handcuffed to a stranger"],
      "Dating Disasters": ["Ghosting", "Catfish", "Ex", "Dick pic", "Bad kisser", "Split the bill", "Meet the parents", "Friend zone", "Rebound", "Third wheel", "Swipe right", "Awkward silence"],
    },
  };

  /* ---------- Pecking Order things to rank ---------- */
  C.pecking = {
    clean: [
      "A hot bath", "Free bread forever", "Being chased by a goose", "Karaoke",
      "Sunday roast", "A massage", "Puppies", "Cheese", "A nap",
      "Bacon sandwich", "A big night out", "Socks with sandals", "Mondays",
      "Brussels sprouts", "Clowns", "Glitter", "Pineapple on pizza",
      "Camping", "Rollercoasters", "Your phone at 1%", "Board games",
      "Spiders", "Christmas jumpers", "Dentist", "A lie-in", "Musicals",
      "Bubble wrap", "Group chats", "Reality TV", "Going to the gym",
      "Tea", "Coffee", "Marmite", "Snow", "A surprise party",
      "Hugging strangers", "Small talk", "Wet socks", "Ducks", "Geese",
      "Fireworks", "Hot weather", "Rain on a tin roof", "Swimming in the sea",
      "Self-checkouts", "Babies on planes", "Breakfast in bed",
    ],
    cheeky: [
      "Skinny dipping", "Morning sex", "A sexy accent", "Spooning",
      "Tequila shots", "A lap dance", "Nudist beaches", "Beer goggles",
      "A booty call", "Handcuffs", "Dirty talk", "A love bite",
      "Being walked in on", "Your ex's new partner", "Tinder", "Hot tubs",
      "Stag & hen dos", "Strip poker", "Sexting typos", "A one-night stand",
    ],
  };

  /* ---------- Quackers cards ---------- */
  // types: likely | never | rather | fowl
  C.quackers = {
    clean: {
      likely: [
        "get chased by a goose and lose", "get banned from a duck pond",
        "cry at an advert", "survive a zombie apocalypse", "get arrested on holiday",
        "marry for money", "start a cult", "become famous for something stupid",
        "talk to animals in a special voice", "eat food off the floor",
        "lose their phone tonight", "secretly be a lizard person",
        "win a reality TV show", "accidentally adopt a duck",
        "fall asleep at their own party", "argue with a self-checkout",
        "go viral for the wrong reason", "be a terrible houseguest",
        "lie about reading a book", "own a duck costume",
      ],
      never: [
        "been chased by a bird", "fed a duck something it really shouldn't eat",
        "walked into a glass door", "sent a text about someone TO that someone",
        "faked being ill to skip something", "pretended to know a song",
        "cried at a kids' film", "fallen over in public and blamed the ground",
        "googled myself", "lied in this game already", "been told off by a stranger",
        "re-gifted a present", "eaten something past its date on purpose",
        "waved back at someone who wasn't waving at me", "laughed at a funeral",
      ],
      rather: [
        "have a duck's bill|have a goose's honk",
        "fight one horse-sized duck|fight a hundred duck-sized horses",
        "have webbed feet|have webbed hands",
        "always smell of pond|always smell of bread",
        "only be able to quack|only be able to honk",
        "be a duck in a city park|be a duck on a posh country estate",
        "have feathers instead of hair|have a beak instead of a nose",
        "waddle everywhere|swim everywhere",
        "lose your phone|lose your keys every single day",
        "be famous but hated|be unknown but loved",
      ],
      fowl: [
        "{p}, waddle across the room like a duck. Full commitment.",
        "{p}, do your best duck impression. The flock scores it out of 10.",
        "Everyone flap your wings! Last duck to stop takes a forfeit.",
        "{p}, speak only in quacks until your next turn.",
        "{p}, give the person on your left a genuinely nice compliment.",
        "{p}, do a dramatic nature-documentary voiceover of the person opposite.",
        "Everyone with something yellow on: you're safe. Everyone else: one forfeit.",
        "{p}, you're the Duck Monarch for one round. Make a rule.",
        "{p}, act out a duck seeing bread for the first time.",
        "Duck duck GOOSE! {p} picks someone to swap seats with. Now.",
      ],
    },
    cheeky: {
      likely: [
        "accidentally send a nude to the family group chat",
        "snog a stranger tonight", "show up to work still drunk",
        "have a secret second family", "get kicked out of a club",
        "join the mile-high club", "slide into a celebrity's DMs",
        "do the walk of shame in fancy dress", "fall asleep mid-snog",
        "hook up with an ex this year", "have a weird kink they'd never admit to",
        "get caught skinny dipping",
      ],
      never: [
        "skinny dipped", "had a crush on a cartoon character",
        "been sick in a taxi", "snogged someone in this room",
        "sent a flirty text to the wrong person", "pretended to be single",
        "kissed someone whose name I didn't know", "been caught mid-sexy-time",
        "faked my own enthusiasm in the bedroom", "lied about my body count",
        "drunk-dialled an ex", "used a dating app in the toilet at a party",
      ],
      rather: [
        "only be able to quack during sexy time|only be able to moan in quacks",
        "be caught with your pants down|be caught with your feathers down",
        "date a duck|date a goose",
        "have your browser history read out|have your texts read out",
        "go on a date with your boss|go on a date with your ex",
        "do the walk of shame|do the waddle of shame",
      ],
      fowl: [
        "{p}, do your most seductive quack. Look someone in the eye.",
        "{p}, show the flock the last photo in your camera roll. No scrolling!",
        "{p}, read out your last sent text. Out loud. With feeling.",
        "{p}, do a slow-motion sexy waddle across the room.",
        "{p}, rate everyone's outfit tonight out of 10. Be honest.",
        "{p}, twerk like a duck shaking off pond water.",
        "Everyone pick who in the room has the best tail feathers. Most picked: take a bow.",
        "{p}, whisper a pickup line to the person on your right. They decide if it worked.",
      ],
    },
  };

  /** Merge a {clean, cheeky} source according to cheeky mode. */
  C.pool = function (src, cheekyOverride) {
    const cheeky = cheekyOverride !== undefined ? cheekyOverride : G.App.state.settings.cheeky;
    if (Array.isArray(src.clean)) return cheeky ? src.clean.concat(src.cheeky) : src.clean.slice();
    const out = Object.assign({}, src.clean);
    if (cheeky) Object.assign(out, src.cheeky);
    return out;
  };
})();
