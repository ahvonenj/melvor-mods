# Melvor Mod Help

## APIs

Most MI APIs can be found under the `game` global object, while `window` contains mostly static data, such as
`AmmoTypeID` or more global / general statistics, such as `FiremakingStats`.

### Player

Counter-intuitively perhaps, there is no `game.player` object. The game treats the concept of `player` as mostly combat-related
and this data is stored in `game.combat.player`.

As for all of the other "player data", the game breaks it down into multiple APIs / classes / objects. 
Below you can find a General API overview and some API breakdowns.

### API Overview

Each of the following APIs exist under the `game` object.

- Player Skill APIs (within `game.<skillname>` objects)
- Skills (`game.skills`, skill data)
- Bank API
- Spells (`ancientSpells`, `archaicSpells`, `auroraSpells`, `curseSpells`, `standardSpells`)
- Character Name (`game.characterName`)
- Combat Areas
- Completion Log
- Current Game Mode
- Dungeons
- Golbin Raid
- GP (Money)
- Items
- Lore
- Maximum Offline Ticks
- Minibar
- Monster Areas
- Monsters
- Normal Attack
- Pets
- Potions
- Prayers
- Settings
- Shop
- Slayer Areas
- Stats (statistics)
- Steam Achievements
- Player Combat Level

### Skill APIs

APIs relating to different skills are mostly located directly under the `game` object, so
for example, `game.agility` object contains properties and methods relating to the Agility skill.

**Usage Example - Setting Skill XP:**

`game.agility.setXP(<value>)`

### Bank
### Spells
### Combat Areas
### Completion Log
### Current Game Mode
### Dungeons
### Golbin Raid
### GP (Money)
### Items
### Lore
### Minibar
### Monster Areas
### Monsters

**Usage Example - Finding monster object by ID:**

`game.monsters.getObjectByID("melvorD:HillGiant")`

**Usage Example - Printing out Giant Crab loot table:**

```js
const crab = game.monsters.getObjectByID("melvorD:GiantCrab");

const drops = crab.lootTable.drops
.map(drop => ({ 
    name: drop.item.name, 
    minQnt: drop.minQuantity, 
    maxQnt: drop.maxQuantity 
}));

console.table(drops);
```

Will print out:

| name              | minQnt        | maxQnt        |
| ----------------- | ------------- | ------------- |
| "Raw Crab"        | 1             | 2             |
| "Treasure Chest"  | 1             | 2             |

### Normal Attack
### Pets
### Potions
### Prayers
### Settings
### Shop
### Slayer Areas
### Slayer

When it comes to the Slayer skill, `game.slayer` contains very little slayer related data or functionality. Consider checking `game.combat.player` and `game.combat.player.manager` objects instead.

For example, information about slayer task completion status can be found in `game.combat.player.manager.slayerTask.completion`. This is an array of slayer task completion amounts from easy to mythical.

### Stats (statistics)
### Steam Achievements

## NamespaceRegistry - Melvor Idle Data and Iterables

You might be wondering why writing something like `game.monsters` into the console window does not actually give any sensible results about the monsters of the game, but instead you are greeted with this `NamespaceRegistry`-object.

These `NamespaceRegistry` objects are sort of interable wrappers / containers for whatever data they are supposed to contain. To put it simply, instead of `game.monsters` being an array like:

`game.monsters = [new Monster(), new Monster()]`

It is instead an object wrapper like:

```js
class MonstersWrapper {
	// Private property, cannot be accessed from outside
	// i.e. game.monsters.monsterArray will not work
	#monsterArr = [new Monster(), new Monster()];

	// Instead, access to monster data is allowed via methods
	forEach(callback) {
		this.#monsterArr.forEach(callback)
	}
}

game.monsters = new MonstersWrapper();
```

So whenever you are faced with a `NamespaceRegistry` object, don't be alarmed, you'll just have to do things a bit differently. For example, to loop through all of the monster objects, you'd do:

```js
game.monsters.forEach(monster => {
	console.log(monster);
});
```

And to find a specific monster by its ID:

```js
game.monsters.find(monster => monster.id === "melvorD:BlackKnight");
// or
game.monsters.getObjectByID("melvorD:BlackKnight")
```

Now, truth to be told, you can actually access the underlying array of monsters directly with:

`game.monsters.allObjects; // [Monster, Monster, Monster, ...]`

But there is probably a reason for why the wrapper exists, so use this at your own risk.

## Game Data and Entity IDs

So where does all the game data actually come from? How does the game know how much Dragon Javelin costs or how much a Shark heals? The answers lie in the following `.json` files:

https://melvoridle.com/assets/schema/gameData.json  
https://melvoridle.com/assets/data/melvorDemo.json  
https://melvoridle.com/assets/data/melvorFull.json  
https://melvoridle.com/assets/data/melvorTotH.json

The first file, `gameData.json` is a schema file, which mainly contains structural and descriptive information, but no "raw values" like item costs or food healing values. This file ties rest of the files together nicely in a sense that it is, for example, a good place to go looking for item/monster/etc IDs. You could think of this file as sort of a _database structure definition_.

The game data itself is separated into the `melvorDemo`, `melvorFull` and `melvorTotH` json-files. These files together basically form a _database_ for the game. `melvorTotH.json` contains data related to the Throne of the Herald expansion and, e.g. the items of that expansion specifically. As for the `melvorDemo` and `melvorFull` files... well they contain everything else, so the non-expansion data, but it is not very clear whether you'll find your Shark healing data from the former or from the latter - there's a trick you can use though (or just trial and error).

If you would like to know how the game knows how much a shark heals, you should start by basically `CTRL+F`ing the `gameData,json` file for "Shark". You want to know the ID of the Shark item and searching for it should return something like `"melvorD:Shark"`. Now the important thing to note here is the prefix `melvorD:` - this prefix can be one of `melvorD`, `melvorF` or `melvorTotH` and by looking at this id, you now know where the item data iself is located.

`melvorD` corresponds to the `melvorDemo.json`, `melvorF` corresponds to the `melvorFull.json` and lastly `melvorTotH` corresponds to the `melvorTotH.json` file.

Now that you can the item ID of the shark, `melvorD:Shark` and you know to search for this id in the `melvorDemo.json` file, you can go do just that. You can search with both `melvorD:Shark` and just `Shark` and you should eventually bump into something like this:

```json
{
  "id": "Shark",
  "productID": "melvorD:Shark",
  "perfectCookID": "melvorD:Shark_Perfect",
  "baseExperience": 186,
  "level": 70,
  "baseInterval": 8000,
  "baseQuantity": 1,
  "categoryID": "melvorD:Fire",
  "itemCosts": [
    {
      "id": "melvorD:Raw_Shark",
      "quantity": 1
    }
  ],
  "gpCost": 0,
  "scCost": 0
}
```

And this:

```json
{
"id": "Shark",
"name": "Shark",
"category": "Cooking",
"type": "Food",
"media": "assets/media/bank/shark_cooked.png",
"ignoreCompletion": false,
"obtainFromItemLog": false,
"golbinRaidExclusive": false,
"sellsFor": 674,
"itemType": "Food",
"healsFor": 20
}
```

And there you have it - item data for Shark!

## How are all of the Adventure Mode health values multiplied by 100?

There's a simple answer to this. In `main.js`, the game defines a variable named `numberMultiplier` in the global scope, which is then used to multiply all health values in many different parts of the game code. The full line of code looks like this:

`numberMultiplier = game.currentGamemode.hitpointMultiplier;`