/* Bigger decks + new decks. Loaded after content.js; merges into the same lists. */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const C = G.GAD_CONTENT;
  const add = (list, more) => { more.forEach((x) => { if (!list.includes(x)) list.push(x); }); };

  /* ---------- Duck in a Hat: lots more ---------- */
  add(C.hat.clean, [
    // people & characters
    "Albert Einstein", "Marilyn Monroe", "Freddie Mercury", "Lady Gaga", "Harry Potter", "Voldemort", "Sherlock Holmes",
    "James Bond", "Mary Poppins", "Willy Wonka", "Peppa Pig", "Spider-Man", "Wonder Woman", "Mr Blobby", "Bob Ross",
    "Gollum", "Yoda", "Elton John", "Madonna", "Michael Jackson", "Oprah", "Barack Obama", "Simon Cowell", "Joe Wicks",
    "Paddington Bear", "Winnie the Pooh", "Mr T", "Hulk Hogan", "Usain Bolt", "Serena Williams", "David Beckham",
    "Marie Curie", "Henry VIII", "Robin Hood", "King Kong", "Godzilla", "Dracula", "Frankenstein", "The Tooth Fairy",
    "Easter Bunny", "Cupid", "Medusa", "Zeus", "Thor", "Captain Hook", "Tinkerbell", "Cinderella", "Rapunzel",
    "Pinocchio", "Shaggy and Scooby", "The Grinch", "Ebenezer Scrooge", "Wallace and Gromit", "Mr Motivator",
    "Gordon Ramsay's mum", "The Pope", "Nessie", "Bigfoot", "A mime", "Your nan",
    // things & places
    "Stonehenge", "Eiffel Tower", "Las Vegas", "Area 51", "The Titanic", "Bermuda Triangle", "Disneyland",
    "Buckingham Palace", "The Moon", "Mount Everest", "Atlantis", "Hogwarts", "Narnia", "The Death Star",
    "Lava lamp", "Fidget spinner", "Rubik's Cube", "Whoopee cushion", "Lawn mower", "Microwave meal", "Air fryer",
    "Hot water bottle", "Onesie", "Crocs", "Bum bag", "Shell suit", "Mullet", "Comb-over", "Monobrow", "Man bun",
    "Six-pack", "Dad bod", "Double chin", "Bunions", "Hiccups", "Brain freeze", "Pins and needles", "Jazz hands",
    "Air guitar", "The robot", "The worm", "Moonwalk", "Macarena", "YMCA", "Limbo", "Musical chairs", "Pass the parcel",
    "Hide and seek", "Hopscotch", "Leapfrog", "Arm wrestling", "Sumo wrestling", "Synchronised swimming", "Curling",
    "Wife carrying", "Cheese rolling", "Bog snorkelling", "Morris dancing", "Line dancing", "Zumba", "Hot yoga",
    "Netflix and chill", "Doom scrolling", "Spam email", "Captcha", "Buffering", "Autocorrect", "Reply all", "Out of office",
    "Monday meeting", "Team building", "Secret Santa", "Office party", "Fire drill", "Photocopier", "Water cooler gossip",
    "Car boot sale", "Jumble sale", "Garden centre", "Soft play", "Ball pit", "Ice rink", "Waterslide", "Lazy river",
    "Haunted castle", "Ghost train", "Hall of mirrors", "Candy floss", "Toffee apple", "Fish and chips", "Full English",
    "Pot Noodle", "Spaghetti hoops", "Prawn cocktail", "Black pudding", "Scotch egg", "Pork pie", "Trifle", "Spotted dick",
    "Jelly and ice cream", "Baked Alaska", "Fondue", "Avocado toast", "Pumpkin spice latte", "Kombucha", "Smoothie bowl",
    "Gender reveal party", "Influencer", "Unboxing video", "ASMR", "Podcast", "TED talk", "Life coach", "Crypto bro",
    "Flat earther", "Conspiracy theory", "Crop circle", "Alien abduction", "Time travel", "Zombie apocalypse",
    "Midlife crisis", "Quarter-life crisis", "Retirement party", "Golden wedding anniversary", "Speed bump",
    "Parking ticket", "Traffic warden", "Road rage", "Learner driver", "Satnav lady", "Cul-de-sac", "Neighbourhood watch",
    "Bin day", "Wheelie bin", "Recycling", "Compost heap", "Allotment", "Scarecrow", "Tractor", "Combine harvester",
    "Hay bale", "Duck pond", "Duck house", "Duckface selfie", "Feather duster", "Down pillow", "Quack doctor",
    "Ugly duckling", "Duck tape", "Duck and cover", "Water off a duck's back", "Rubber ring", "Paddle boat", "Swan pedalo",
  ]);
  add(C.hat.cheeky, [
    "Chippendales", "Magic Mike", "Ann Summers", "Brazilian wax", "Back hair", "Builder's bum", "Muffin top",
    "Moobs", "Camel toe", "Wardrobe malfunction", "Streaker", "Mooning", "Nip slip", "Love handles", "Bikini line",
    "Fake boobs", "Botox", "Sugar daddy", "Cougar", "Toy boy", "Friends with benefits", "Netflix and chill",
    "Third date", "Morning glory", "Pillow talk", "Kiss chase", "Spin the bottle", "Seven minutes in heaven",
    "Truth or dare", "Body glitter", "Massage parlour", "Swingers party", "Nudist camp", "Dogging", "Love Island villa",
    "Hickey", "Beer belly", "Drunk text", "Drunk kebab", "Kebab on the night bus", "Tequila slammer", "Jägerbomb",
    "Pub crawl", "Lock-in", "Karaoke ballad at 2am", "Hangxiety", "Beer fear", "Sambuca", "Vodka Red Bull",
    "Sex on the Beach", "Slippery nipple", "Porn star martini", "Wet wipes", "Fishnets", "Suspenders", "Leather trousers",
    "Gimp suit", "Fluffy handcuffs", "Rabbit", "Love eggs", "Kama Sutra", "Missionary", "Quickie", "Spoon",
    "Big spoon", "Little spoon", "Sexy nurse", "Sexy pirate", "Sexy duck costume", "Hen night willy straws",
    "Willy warmer", "Peeping Tom", "Booty shorts", "Thirst trap", "Sliding into DMs", "Left on read", "Ick",
    "Rizz", "Situationship", "Beard rash", "Love bite cover-up", "Shotgun wedding", "Divorce party",
  ]);

  /* ---------- Scrawl-ack: more prompts ---------- */
  add(C.scrawl.clean, [
    "A duck stuck in a traffic jam", "A duck's passport photo", "A duck who's just won the lottery",
    "A goose working as a bouncer", "A swan getting a spray tan", "A duck at the gym skipping leg day",
    "Ducks having a pillow fight", "A duck's very first selfie", "A duck reading the news",
    "A duck stuck in a tree", "A duck on a first-class flight", "A duck's family portrait",
    "A duck doing stand-up comedy", "A duck afraid of water", "The world's angriest duckling",
    "A duck running a marathon", "A duck being knighted", "A duck stuck in a vending machine",
    "A duck winning Bake Off", "A duck at a wedding objecting", "A duck in witness protection",
    "A duck skiing badly", "A duck learning to drive", "A duck hiding from the tax man",
    "A duck caught shoplifting bread", "A duck running for Prime Minister", "A duck seeing snow for the first time",
    "A duck's midlife motorbike", "A duck doing a magic trick that went wrong", "A duck in a horror film",
    "A duck on a dating show", "A duck's terrible tattoo", "A duck with a jetpack", "A duck sumo wrestler",
    "A duck haunting a house", "A goose stealing a baguette", "A duck on a spa day", "Ducks at a funeral for a crust",
  ]);
  add(C.scrawl.cheeky, [
    "A duck's awkward first kiss", "A goose doing a lap dance", "A duck getting a Brazilian",
    "A duck caught sneaking out at 6am", "A duck's sexy selfie gone wrong", "A duck at an Ann Summers party",
    "Two swans making a heart with their necks (but rude)", "A duck at a swingers' party", "A duck's saucy holiday snap",
    "A duck doing a body shot", "A duck in a mankini", "A drunk duck trying to get a kebab",
    "A duck's love letter to a goose", "A duck hiding a love bite", "A duck sexting a swan",
    "A pigeon photobombing a romantic moment", "A duck on a nudist beach applying sun cream", "A cockerel and a duck on a date",
    "A duck's dirty weekend in Blackpool", "A duck doing the walk of shame in heels", "A duck's hen party strippergram",
  ]);

  /* ---------- Duck Duck Goose: more categories ---------- */
  Object.assign(C.goose.clean, {
    "Sports": ["Football", "Darts", "Snooker", "Tennis", "Golf", "Boxing", "Cricket", "Rugby", "Skiing", "Surfing", "Bowling", "Badminton"],
    "Fairy Tales": ["Cinderella", "Big bad wolf", "Gingerbread man", "Glass slipper", "Poisoned apple", "Beanstalk", "Three bears", "Pumpkin carriage", "Frog prince", "Wicked witch", "Magic mirror", "Spinning wheel"],
    "In the Bathroom": ["Toothbrush", "Bath bomb", "Loofah", "Plunger", "Shower cap", "Rubber duck", "Toilet roll", "Razor", "Bathroom scales", "Mouthwash", "Hairdryer", "Towel"],
    "School Days": ["Detention", "Packed lunch", "Headteacher", "Times tables", "Sports day", "Homework", "School trip", "Playground", "Nativity play", "Dinner lady", "Pencil case", "Fire drill"],
  });
  Object.assign(C.goose.cheeky, {
    "Bedroom Drawer": ["Fluffy handcuffs", "Massage candle", "Feather tickler", "Lube", "Blindfold", "Edible undies", "Nipple tassels", "Fishnets", "Love dice", "Silk scarf", "Spare batteries", "Whip"],
    "Rough Morning": ["Hangover", "Mystery bruise", "Kebab wrapper", "Walk of shame", "Missed calls", "Smudged makeup", "Strange bed", "Lost shoe", "Bacon sandwich", "Paracetamol", "Regret", "Cold pizza"],
  });

  /* ---------- Pecking Order: more ---------- */
  add(C.pecking.clean, [
    "Camping in the rain", "Crocs", "Ikea on a Saturday", "A cold shower", "Tax returns", "Bin day", "Cats", "Dogs",
    "Babies", "Weddings", "Funerals with buffets", "Kids' parties", "Musicals", "Jazz", "Opera", "Line dancing",
    "Morris dancing", "Bingo", "A spa day", "A hot curry", "Roast potatoes", "Gravy", "Cheese on toast", "Chips",
    "Sushi", "Olives", "Mushrooms", "Coriander", "Liquorice", "Black pudding", "A road trip", "Flying",
    "Cruises", "All-inclusive holidays", "Theme parks", "Museums", "Hiking", "Cold water swimming", "Saunas",
    "Fancy dress", "Christmas", "Halloween", "Valentine's Day", "Your birthday", "Monday mornings", "Friday nights",
    "Sunday evenings", "Voice notes", "Phone calls", "Emails", "Small dogs", "Big dogs", "Pigeons", "Seagulls", "Geese",
  ]);
  add(C.pecking.cheeky, [
    "Dirty dancing", "Kissing in public", "Sex on holiday", "Massages with happy endings", "Lingerie", "Shower sex",
    "Sexy role play", "Slow dancing", "Being serenaded", "Butt slaps", "Whispered dirty talk", "Hickeys",
    "Fancy dress in the bedroom", "Strip clubs", "Sexy texts at work", "A threesome", "Hair pulling", "Breakfast in bed after",
  ]);

  /* ---------- Quackers: way more, plus two new card types ---------- */
  const Q = C.quackers;
  Q.clean.hottake = []; Q.cheeky.hottake = []; Q.clean.whowould = []; Q.cheeky.whowould = [];
  add(Q.clean.likely, [
    "fall in love on holiday", "get lost in their own town", "become a millionaire", "end up on Crimewatch",
    "laugh at the worst possible moment", "adopt twelve cats", "move abroad on a whim", "forget their own birthday",
    "become a TikTok star", "get stuck in a toilet", "cry at their own wedding speech", "befriend a seagull",
    "sleep through an earthquake", "eat a whole pizza alone", "run a marathon dressed as a duck", "become a cult leader",
    "get kicked off a plane", "talk their way out of a speeding ticket", "faint at the sight of blood",
    "still be here at 4am", "be first on the dance floor", "say something wildly inappropriate at a funeral",
    "secretly love musicals", "know every word to a Spice Girls song", "lose a fight with a goose",
    "have a five-year plan", "pretend to be busy to avoid plans", "accidentally like an old photo",
    "become a conspiracy theorist", "survive on a desert island", "get a tattoo they regret",
  ]);
  add(Q.cheeky.likely, [
    "have sex in a public toilet", "have a secret Tinder account", "date someone twice their age",
    "get caught sexting at work", "have a one-night stand on holiday", "sleep with a friend's ex",
    "own a sex swing", "flash someone by accident", "fall asleep naked somewhere weird", "go to a swingers' party",
    "get a Brazilian for a first date", "have done it in a car", "moan someone else's name", "join OnlyFans",
    "snog a bouncer to get in", "get a love bite at 40", "fake an orgasm", "do the walk of shame twice in one weekend",
  ]);
  add(Q.clean.never, [
    "pretended my phone was dying to end a call", "eaten food out of the bin", "peed in a swimming pool",
    "sung karaoke sober", "been on TV", "broken a bone", "got lost in a supermarket", "cried at work",
    "fallen asleep at the cinema", "been kicked out of a shop", "stolen a traffic cone", "lied about my age",
    "dyed my hair a terrible colour", "cut my own fringe", "ghosted a friend", "sent a voice note longer than five minutes",
    "pretended to laugh at a joke I didn't get", "had a crush on a teacher", "eaten a whole cake alone",
    "worn the same pants two days running", "screamed at a spider", "been chased by a goose (honestly)",
  ]);
  add(Q.cheeky.never, [
    "had sex outdoors", "sent a nude", "slept with someone on the first date", "been to a sex shop",
    "been caught masturbating", "had a sex dream about someone in this room", "lied about where I was last night",
    "had a threesome", "flashed someone", "been on a sex holiday", "used handcuffs", "made a sex tape",
    "kissed two people in one night", "had sex at a wedding", "stalked an ex online at 3am",
  ]);
  add(Q.clean.rather, [
    "be able to talk to ducks|be able to fly like a duck", "never eat bread again|never eat cheese again",
    "have a rewind button|have a pause button", "be stuck in a lift with your boss|with your ex",
    "sing everything you say|dance everywhere you go", "always be 10 minutes late|always be 2 hours early",
    "have no eyebrows|have one giant monobrow", "fight a goose|fight a swan",
    "live in a duck pond|live in a bird cage", "know when you'll die|know how you'll die",
    "have a personal chef|have a personal masseuse", "only wear onesies|only wear suits",
    "lose your sense of taste|lose your sense of smell", "be famous on TikTok|be famous in history books",
    "have hiccups forever|feel like you need to sneeze forever", "never use social media again|never watch TV again",
  ]);
  add(Q.cheeky.rather, [
    "have sex with the lights on|lights off", "be a terrible kisser|be terrible in bed",
    "have your parents walk in|have your kids walk in", "date someone who's hot but boring|ugly but hilarious",
    "go a year without sex|a year without alcohol", "your partner be clingy|your partner be distant",
    "send a nude to your boss|to your mum", "have a loud moan|a weird sex face",
    "sleep with your celebrity crush once|marry someone who looks a bit like them", "have a hairy back|a hairy bum",
  ]);
  add(Q.clean.fowl, [
    "{p}, quack the national anthem.", "{p}, do your best impression of the person to your left.",
    "{p}, tell the flock your most embarrassing moment. Go.", "{p}, swap an item of clothing with someone.",
    "{p}, show the flock your most recent Google search.", "{p}, do 10 duck squats (squat, flap, quack).",
    "{p}, talk in a posh accent until your next turn.", "{p}, let the flock pick your phone wallpaper for a day.",
    "{p}, hum a song — first to guess it gives a forfeit.", "Everyone: last person to touch their nose does a forfeit.",
    "{p}, give a 30-second TED talk on bread.", "{p}, propose to the nearest object. Make it romantic.",
  ]);
  add(Q.cheeky.fowl, [
    "{p}, describe your perfect date using only duck noises.", "{p}, do your sexiest walk to the kitchen and back.",
    "{p}, reveal who in your phone you'd least want reading your texts.", "{p}, give someone a 10-second shoulder massage.",
    "{p}, tell the flock your worst ever pick-up line. Then use it on someone.", "{p}, let the person on your right send one emoji to someone in your contacts.",
    "{p}, demonstrate your signature dance move. Seductively.", "{p}, act out your best 'morning after' face.",
  ]);
  add(Q.clean.hottake, [
    "Pineapple belongs on pizza", "Ducks are better than dogs", "Geese are just evil ducks", "Cereal is a soup",
    "A hot dog is a sandwich", "Cats are secretly plotting against us", "Christmas songs before December should be illegal",
    "Breakfast is the best meal", "Board games ruin friendships", "Socks with sandals are fine actually",
    "Musicals are the highest form of art", "Coriander tastes like soap", "Camping is just homelessness with extra steps",
    "Tea is better than coffee", "Swans are overrated", "You should always recline your seat on a plane",
    "Brown sauce beats ketchup", "Marmite is delicious", "Voice notes should be banned", "Clapping when the plane lands is fine",
    "Ducks would make terrible politicians", "Bread is a personality", "Gym selfies are acceptable", "Jaffa Cakes are biscuits",
  ]);
  add(Q.cheeky.hottake, [
    "Morning sex beats night sex", "Sex on the first date is fine", "Spooning is overrated", "Size matters",
    "It's fine to stalk your date's ex", "Sexting counts as cheating", "Dirty talk is always cringe",
    "Lingerie is a waste of money", "Shower sex is overrated", "You should know your partner's body count",
    "Holiday romances don't count", "Snoring is a dealbreaker",
  ]);
  add(Q.clean.whowould, [
    "Who would you want with you in a zombie apocalypse", "Who would you call to help hide a body",
    "Who would you trust to pick your outfit", "Who would win in a fight with a goose",
    "Who would you want planning your birthday", "Who would survive longest on a desert island",
    "Who would you want as your lawyer", "Who would be the best at Duck in a Hat", "Who gives the best hugs",
    "Who would you send to do your job interview", "Who would win a dance-off", "Who would make the best duck",
    "Who would you take on a road trip", "Who would you want cooking your last meal", "Who would be the best parent to a duckling",
  ]);
  add(Q.cheeky.whowould, [
    "Who would you want as your wingman", "Who has the best bum", "Who's the best kisser (allegedly)",
    "Who would you call for a 3am kebab", "Who would be best in a strip poker game", "Who would make the best stripper",
    "Who has the dirtiest search history", "Who would you trust with your nudes", "Who would be the most fun on a stag or hen do",
    "Who's most likely to pull tonight",
  ]);

  /* ---------- Quack Back prompts (fill in the blank — write the funniest answer) ---------- */
  C.quackback = {
    clean: [
      "The worst thing to find in a duck pond", "A terrible name for a duck", "The real reason geese are so angry",
      "What ducks secretly think about humans", "A rejected flavour of crisps", "The worst thing to say at a wedding",
      "A bad thing to shout in a library", "The worst superpower", "A terrible theme for a children's party",
      "What the Queen kept in her handbag", "The worst thing to hear from a pilot", "A rubbish Olympic sport",
      "The title of a duck's autobiography", "What's really inside a haggis", "A terrible name for a boat",
      "The worst job interview answer", "A sign you've had too much bread", "The first thing aliens would complain about",
      "A bad slogan for a funeral home", "The worst thing to find in your sandwich", "An awful first line of a novel",
      "A terrible name for a perfume", "What dogs dream about", "The worst thing to put on a CV",
      "A new rule for the duck pond", "The worst present to give your nan", "What ghosts do on their day off",
      "A terrible thing to say on a first date", "The secret ingredient in grandma's soup", "A rubbish superhero name",
      "The worst thing to bring to a picnic", "What the Loch Ness Monster does for money", "A bad name for a pub",
      "A terrible reason to call 999", "The worst fortune cookie message", "What swans whisper to each other",
      "The worst thing to accidentally post online", "A bad thing to name your WiFi", "The worst flavour of ice cream",
      "A rejected Christmas song", "The least scary horror film title", "What really happened to the dinosaurs",
      "The worst thing your satnav could say", "A sign your house is haunted by a duck", "The real reason you were late",
      "A terrible thing to engrave on a trophy", "The worst thing to hear during surgery", "A new emoji the world needs",
      "What's in the duck's suitcase", "The worst sound to wake up to", "A bad name for a gym",
      "The duck's last words", "What you should never say to a goose", "The worst thing to find under your bed",
      "A terrible motivational quote", "A new national holiday", "The worst thing to bring to a job interview",
      "A rejected name for the Moon", "A sign the duck is plotting something", "The worst text to get from your mum",
    ],
    cheeky: [
      "The worst thing to moan in bed", "A terrible safe word", "The worst thing to say after sex",
      "What's really in the bedside drawer", "A bad name for a sex toy", "The worst chat-up line ever",
      "What the duck does on a dirty weekend", "A terrible thing to text your ex at 2am", "The worst thing to find in a hotel bed",
      "A bad name for a strip club", "What your nan's search history says", "The worst thing to say on a stag do",
      "A rejected position from the Kama Sutra", "The worst thing to accidentally send to the family group chat",
      "What the swan said in the morning", "The worst tattoo to get on your bum", "A terrible thing to whisper in someone's ear",
      "Something you shouldn't do in a hot tub", "The worst way to be walked in on", "A filthy name for a cocktail",
      "Why the goose got arrested", "The real reason the duck is single", "The worst thing to hear during a lap dance",
      "What's printed on the duck's underpants", "The worst opening line on Tinder", "A bad thing to do at an orgy",
      "What happens on a duck's hen do", "The cheekiest thing in the duck pond", "A sexy name for a duck",
      "What the duck really meant by 'quack'",
    ],
  };

  /* ---------- Doodle Duck words (things you can draw) ---------- */
  C.doodle = {
    clean: [
      "duck", "goose", "swan", "frog", "snail", "octopus", "jellyfish", "shark", "penguin", "giraffe", "elephant", "snake",
      "spider", "butterfly", "bee", "owl", "pig", "cow", "sheep", "horse", "unicorn", "dragon", "dinosaur", "crab",
      "whale", "hedgehog", "bat", "kangaroo", "flamingo", "peacock", "chicken", "egg", "bread", "toast", "banana",
      "pineapple", "pizza", "burger", "hot dog", "ice cream", "doughnut", "cake", "cupcake", "cheese", "sandwich",
      "carrot", "broccoli", "mushroom", "watermelon", "cherry", "apple", "pear", "lemon", "taco", "sushi", "popcorn",
      "house", "castle", "lighthouse", "igloo", "tent", "bridge", "volcano", "island", "rainbow", "sun", "moon",
      "star", "cloud", "lightning", "snowman", "tornado", "tree", "flower", "cactus", "mountain", "waterfall",
      "car", "bicycle", "train", "aeroplane", "rocket", "boat", "submarine", "helicopter", "tractor", "skateboard",
      "hat", "glasses", "shoe", "sock", "crown", "umbrella", "backpack", "key", "lock", "clock", "phone", "camera",
      "guitar", "drum", "trumpet", "piano", "microphone", "television", "computer", "robot", "ghost", "alien",
      "mermaid", "pirate", "wizard", "witch", "vampire", "zombie", "angel", "ninja", "astronaut", "superhero", "king",
      "bath", "toilet", "toothbrush", "bed", "sofa", "lamp", "candle", "ladder", "bucket", "spade", "hammer", "scissors",
      "balloon", "kite", "present", "Christmas tree", "pumpkin", "fireworks", "birthday cake", "trophy", "medal",
      "football", "tennis", "bowling", "skiing", "fishing", "swimming", "surfing", "juggling", "yoga", "karate",
      "rubber duck", "duck pond", "bread crumbs", "nest", "feather", "footprint", "anchor", "treasure chest",
      "sandcastle", "deckchair", "ice lolly", "beach ball", "palm tree", "sunglasses", "map", "compass", "magnet",
      "light bulb", "heart", "broken heart", "skeleton", "brain", "eye", "nose", "teeth", "moustache", "beard", "wig",
      "traffic light", "stop sign", "snowflake", "hot air balloon", "roller coaster", "ferris wheel", "circus tent",
      "toilet roll", "plunger", "spaghetti", "noodles", "chopsticks", "teapot", "wine glass", "pint of beer",
    ],
    cheeky: [
      "bikini", "boobs", "bum", "thong", "bra", "kiss", "lipstick", "high heels", "handcuffs", "whip", "hot tub",
      "love bite", "mankini", "condom", "banana (rude)", "aubergine", "peach", "nipple", "skinny dipping",
      "walk of shame", "hangover", "kebab", "strip tease", "lap dance", "massage", "naked duck", "hickey", "mooning",
      "pole dance", "speedos", "love heart pants", "bed", "spoon", "cocktail", "tequila shot", "beer goggles",
    ],
  };

  /* ---------- picking without repeats ---------- */
  /** Pick n items from pool, preferring ones not in `used` (an array we update in place). */
  C.fresh = function (pool, n, used) {
    const usedSet = new Set(used);
    const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let unused = shuffle(pool.filter((x) => !usedSet.has(typeof x === "string" ? x : JSON.stringify(x))));
    if (unused.length < n) { used.length = 0; unused = unused.concat(shuffle(pool.filter((x) => !unused.includes(x)))); }
    const out = unused.slice(0, n);
    out.forEach((x) => used.push(typeof x === "string" ? x : JSON.stringify(x)));
    // forget the oldest so lists never get huge
    const cap = Math.max(20, Math.floor(pool.length * 0.85));
    if (used.length > cap) used.splice(0, used.length - cap);
    return out;
  };
})();
