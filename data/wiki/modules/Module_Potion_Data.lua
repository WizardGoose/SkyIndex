--[[

Quick Copy:

['Name'] = {
		maxLevel = #,
		color = 'Color',
		ttColor = '#',
		desc = 'Desc',
		basedesc = 'Desc', -- find its description in the collection menu (if exist), or create it on your own
		vars = {
			{99, 99, 99, 99, 99, 99, 99, 99, 99},
		},
		ingredients = { [1]='Thing', [3]='Enchanted Thing', [5]='Enchanted Something Thing', ['9text']='wikitext', basePotion='name of potion if not Awkward Potion', basePotionUsedForLevel=true },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E', 'E'},
		duration = '#', (Don't forget to account for Alchemy level!)
		id = 'POTIONNAME',
	},

]]--

return {
	['Speed'] = {
		maxLevel = 8,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Grants &a+{0} &f Speed&7.',
		vars = {
			{5, 10, 15, 20, 25, 30, 35, 40},
		},
		ingredients = { [1]='Sugar', [3]='Enchanted Sugar', [5]='Enchanted Sugar Cane' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'SPEED',
	},
	
	['Jump Boost'] = {
		maxLevel = 4,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Increases your jump height by/&a{0} blocks&7.',
		vars = {
			{1.9, 2.5, 3.2, 4.1},
		},
		ingredients = { [1]='Rabbit\'s Foot' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'JUMP_BOOST',
	},
	
	['Water Breathing'] = {
		maxLevel = 6,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Grants a &a{0}% &7chance of not/&7taking drowning damage.',
		vars = {
			{15, 30, 45, 60, 80, 100},
		},
		ingredients = { [1]='Pufferfish', [3]='Enchanted Pufferfish' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R'},
		duration = '3:00',
		id = 'WATER_BREATHING',
	},
	
	['Regeneration'] = {
		maxLevel = 9,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Grants &c+{0} Health Regen&7.',
		vars = {
			{2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30},
		},
		ingredients = { [1]='Ghast Tear', [5]='Enchanted Ghast Tear', ['9text']='[[Trinity]]' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E', 'E'},
		duration = '3:00',
		id = 'REGENERATION',
	},
	
	['Strength'] = {
		maxLevel = 8,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Increases &c Strength &7by/&a{0}&7.',
		vars = {
			{5, 12.5, 20, 30, 40, 50, 60, 75},
		},
		ingredients = { [1]='Blaze Powder', [3]='Enchanted Blaze Powder', [5]='Enchanted Blaze Rod' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'STRENGTH',
	},
	
	['Adrenaline'] = {
		maxLevel = 8,
		color = 'Red',
		ttColor = 'c',
		desc = '&7Grants &a+{0} HP &7of absorption/&7and &a+{1} &f Speed&7.',
		basedesc = '&7Grants a boost in absorption/&7health and an increase in &f/&fSpeed&7.',
		vars = {
			{20, 40, 60, 80, 100, 150, 200, 300},
			{5, 10, 15, 20, 25, 30, 35, 40},
		},
		ingredients = { [1]='Cocoa Beans', [3]='Enchanted Cocoa Beans', [5]='Enchanted Cookie' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'ADRENALINE',
	},
	
	['Wounded'] = {
		maxLevel = 4,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Reduces &c{0}% &7of healing.',
		basedesc = '&7Reduces healing.',
		vars = {
			{25, 50, 75, 100},
		},
		ingredients = { [1]='Netherrack' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'WOUNDED',
	},
	
	['Night Vision'] = {
		maxLevel = 2,
		color = 'Dark Purple',
		ttColor = '5',
		desc = '&7Grants greater visibility at/&7night.',
		ingredients = { [1]='Golden Carrot' },
		rarity = {'C', 'C'},
		duration = '3:00',
		id = 'NIGHT_VISION',
	},
	
	['Invisibility'] = {
		maxLevel = 1,
		color = 'DarkGray',
		ttColor = '8',
		desc = '&7Grants invisibility from players/&7and mobs.',
		ingredients = { [1]='Fermented Spider Eye', basePotion='Night Vision Potion' },
		rarity = {'C'},
		duration = '3:00',
		id = 'INVISIBILITY',
	},
	
	['Poison'] = {
		maxLevel = 4,
		color = 'DarkGreen',
		ttColor = '2',
		desc = '&7Deals &c{0} HP &7damage per/&7second.',
		vars = {
			{10, 20, 40, 60},
		},
		ingredients = { [1]='Spider Eye' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'POISON',
	},
	
	['Healing'] = {
		maxLevel = 9,
		color = 'Red',
		ttColor = 'c',
		desc = '&7Heals for &a+{0} &7every second.',
		vars = {
			{5, 10, 15, 20, 25, 30, 35, 40, 45},
		},
		ingredients = { [1]='Glistering Melon Slice', [3]='Enchanted Melon Slice', [5]='Enchanted Glistering Melon Slice' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E', nil},
		duration = '0:05',
		id = 'HEALING',
	},
	
	['Fire Resistance'] = {
		maxLevel = 1,
		color = 'Red',
		ttColor = 'c',
		desc = '&7Receive &a10%&7 reduced damage from/&cfire&7 and &clava&7.',
		ingredients = { [1]='Magma Cream' },
		rarity = {'C'},
		duration = '3:00',
		id = 'FIRE_RESISTANCE',
	},
	
	['Experience'] = {
		maxLevel = 4,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Gain &a{0}% &7more experience/&7orbs.',
		basedesc = '&7Gain more experience orbs.',
		vars = {
			{5, 10, 15, 20},
		},
		ingredients = { [1]='Lapis Lazuli' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'EXPERIENCE',
	},
	
	['Weakness'] = {
		maxLevel = 8,
		color = 'Gray',
		ttColor = '7',
		desc = '&7Reduces &c Damage &7when/&7attacking enemies by &c{0}&7.',
		vars = {
			{5, 10, 15, 20, 25, 30, 40, 50},
		},
		ingredients = { [1]='Fermented Spider Eye', [3]='Enchanted Spider Eye', [5]='Enchanted Fermented Spider Eye', basePotion='Water Bottle' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'WEAKNESS',
	},
	
	['Blindness'] = {
		maxLevel = 3,
		color = 'White',
		ttColor = 'f',
		desc = '&7Grants blindness to the affected/&7player.',
		basedesc = '&7Grants blindness to the affected/&7player.',
		ingredients = { [1]='Ink Sac', [3]='Enchanted Ink Sac' },
		rarity = {'C', 'C', 'U'},
		duration = '0:02',--Assumed based on calculating from Alchemy level increase
		id = 'BLINDNESS',
	},
	
	['Slowness'] = {
		maxLevel = 8,
		color = 'Gray',
		ttColor = '7',
		desc = '&Removes &f{0} Speed&7.',
		vars = {
			{20, 40, 75, 99, 150, 240, 380, 500},
		},
		ingredients = { [1]='Fermented Spider Eye', basePotion='Speed Potion', basePotionUsedForLevel=true },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'SLOWNESS',
	},
	
	['Damage'] = {
		maxLevel = 8,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Instantly deals &c{0} &7damage.',
		vars = {
			{5, 10, 15, 20, 25, 30, 40, 50},
		},
		ingredients = { [1]='Fermented Spider Eye', basePotion='Healing Potion', basePotionUsedForLevel=true },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = nil,
		id = 'DAMAGE',
	},
	
	['Haste'] = {
		maxLevel = 4,
		color = 'Yellow',
		ttColor = 'e',
		desc = '&7Increases your mining speed by/&a{0}%&7.',
		basedesc = '&7Increases your mining speed.',
		vars = {
			{50, 100, 150, 200},
		},
		ingredients = { [1]='Coal' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'HASTE',
	},
	
	['Burning'] = {
		maxLevel = 4,
		color = 'Gold',
		ttColor = '6',
		desc = '&7Increases the duration of fire/&7damage that you inflict on/&7enemies by /&a{0}%&7.',
		basedesc = '&7Increases the duration of fire/&7damage that you inflict on/&7enemies.',
		vars = {
			{5, 10, 15, 20},
		},
		ingredients = { [1]='Red Sand' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'BURNING',
	},
	
	['Knockback'] = {
		maxLevel = 4,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Damaging enemies deals &a{0}%/&7more knockback.',
		basedesc = '&7Damaging enemies deals more/&7knockback.',
		vars = {
			{20, 40, 60, 80},
		},
		ingredients = { [1]='Slimeball' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'KNOCKBACK',
	},
	
	['Stun'] = {
		maxLevel = 4,
		color = 'DarkGray',
		ttColor = '8',
		desc = '&7When applied to yourself\\, your/&7hits have a &a{0}% &7chance to/&7stun enemies for &a1s&7. When/&7splashed\\, enemies are stunned/&7for &a{1}s&7.',
		basedesc = '&7When applied to yourself\\, your/&7hits have a &7chance to stun/&7enemies. When splashed\\, enemies/&7are stunned.',
		vars = {
			{10, 20, 30, 40},
			{1, 1.25, 1.5, 1.75},
		},
		ingredients = { [1]='Obsidian' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'STUN',
	},
	
	['Archery'] = {
		maxLevel = 4,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Increases bow damage by/&a{0}%&7.',
		basedesc = '&7Increases bow damage.',
		vars = {
			{12.5, 25, 50, 75},
		},
		ingredients = { [1]='Feather' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'ARCHERY',
	},
	
	['Absorption'] = {
		maxLevel = 8,
		color = 'Gold',
		ttColor = '6',
		desc = '&7Grants &a+{0} HP &7of absorption.',
		basedesc = '&7Grants a boost to absorption/&7health.',
		vars = {
			{20, 40, 60, 80, 100, 150, 200, 300},
		},
		ingredients = { [1]='Gold Ingot', [3]='Enchanted Gold Ingot', [5]='Enchanted Gold Block' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'ABSORPTION',
	},
	
	['Dodge'] = {
		maxLevel = 4,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Mob attacks have a &a{0}%/&7chance to miss.',
		basedesc = '&7Mob attacks have a chance to/&7miss.',
		vars = {
			{10, 20, 30, 40},
		},
		ingredients = { [1]='Raw Salmon' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'DODGE',
	},
	
	['Resistance'] = {
		maxLevel = 8,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Increases &a Defense &7by/&a+{0}&7.',
		basedesc = '&7Increases &a❈ Defense&7.',
		vars = {
			{5, 10, 15, 20, 30, 40, 50, 60},
		},
		ingredients = { [1]='Cactus', [3]='Enchanted Cactus Green', [5]='Enchanted Cactus' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'RESISTANCE',
	},
	
	['Mana'] = {
		maxLevel = 8,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Grants &b+{0}  Mana &7per second.',
		basedesc = '&7Grants additional  Mana/&7regeneration over time.',
		vars = {
			{1, 2, 3, 4, 5, 6, 7, 8},
		},
		ingredients = { [1]='Raw Mutton', [3]='Enchanted Raw Mutton', [5]='Enchanted Cooked Mutton' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E', 'E'},
		duration = '3:00',
		id = 'MANA',
	},
	
	['Agility'] = {
		maxLevel = 4,
		color = 'Dark Purple',
		ttColor = '5',
		desc = '&7Grants &a+{0} &f Speed &7and/&7increases the chance for mob/&7attacks to miss by &a{0}%&7.',
		basedesc = '&7Grants a &f Speed &7boost and/&7increases the chance for mob/&7attacks to miss.',
		vars = {
			{10, 20, 30, 40},--Vars 1 and 2 are identical
		},
		ingredients = { [1]='Enchanted Cake' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'AGILITY',
	},
	
	['Rabbit'] = {
		maxLevel = 6,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants Jump Boost {0} and &a+{1}/&f Speed&7.',
		basedesc = '&7Grants Jump Boost and an/increase in &f Speed&7.',
		vars = {
			{1, 1, 2, 2, 3, 3},
			{10, 20, 30, 40, 50, 60},
		},
		ingredients = { [1]='Raw Rabbit', [3]='Enchanted Rabbit Foot' },
		rarity = {'C', 'C', 'U', 'U', 'R', 'R'},
		duration = '3:00',
		id = 'RABBIT',
	},
	
	['Critical'] = {
		maxLevel = 4,
		color = 'DarkRed',
		ttColor = '4',
		desc = '&7Increases &9 Crit Chance &7by/&a{0}% &7and &9 Crit Damage &7by/&a{1}%&7.',
		basedesc = '&7Increases &9 Crit Chance &7and/&9 Crit Damage&7.',
		vars = {
			{10, 15, 20, 25},
			{10, 20, 30, 40},
		},
		ingredients = { [1]='Flint' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'CRITICAL',
	},
	
	['True Resistance'] = {
		maxLevel = 4,
		color = 'White',
		ttColor = 'f',
		desc = '&7Gain &f+{0} True Defense&7.',
		vars = {
			{5, 10, 15, 20},
		},
		ingredients = { [1]='True Essence' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'TRUE_RESISTANCE',
	},
	
	['Spelunker'] = {
		maxLevel = 5,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Grants &a{0} &6 Mining/&6Fortune&7.',
		basedesc = '&7Grants &6 Mining Fortune&7.',
		vars = {
			{5, 10, 15, 20, 25},
		},
		ingredients = { [1]='Mithril', ['5text']='[[God Potion]] only]]' },
		rarity = {'C', 'C', 'U', 'U', 'R'},
		duration = '3:00',
		id = 'SPELUNKER',
	},
	
	['Spirit'] = {
		maxLevel = 4,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Grants &a+{0} &f Speed &7and/&a+{0}% &9 Crit Damage&7.',
		vars = {
			{10, 20, 30, 40},--Vars 1 and 2 are identical
		},
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'SPIRIT',
	},
	
	['Magic Find'] = {
		maxLevel = 4,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Gain &a+{0}% &7chance to find/&7rare items from monsters and/&7bosses.',
		vars = {
			{10, 25, 50, 75},
		},
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'MAGIC_FIND',
	},
	
	['Stamina'] = {
		maxLevel = 4,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Instantly heals for &a+{0} HP&7/&7and a grants a &b{1}  Mana/&7boost.',
		vars = {
			{150, 215, 315, 515},
			{50, 100, 150, 200},
		},
		ingredients = { [1]='Foul Flesh' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'STAMINA',
	},
	
	['Venomous'] = {
		maxLevel = 4,
		color = 'Dark Purple',
		ttColor = '5',
		desc = '&7Grants &c{0} &f Speed &7and/&7deals &c{1} HP &7damage per/&7second.',
		basedesc = '&7Grants a reduction in &f Speed/&7and deals damage over time.',
		vars = {
			{-5, -10, -15, -20},
			{5, 10, 15, 20},
		},
		ingredients = { [1]='Poisonous Potato' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'VENOMOUS',
	},
	
	['Pet Luck'] = {
		maxLevel = 4,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Gain &a+{0}% &7chance to find pets/&7and craft higher tier pets',
		basedesc = '&7Increases how many pets you find/&7and gives you better luck when/&7crafting pets.',
		vars = {
			{5, 10, 15, 20},
		},
		ingredients = { [1]='Enchanted Rabbit Hide' },
		rarity = {'C', 'C', 'U', 'U'},
		duration = '3:00',
		id = 'PET_LUCK',
	},
	
	['Farming XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Farming Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'FARMING_XP_BOOST',
	},
	
	['Mining XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Mining Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'MINING_XP_BOOST',
	},
	
	['Combat XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Combat Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'COMBAT_XP_BOOST',
	},
	
	['Foraging XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Foraging Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'FORAGING_XP_BOOST',
	},
	
	['Fishing XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Fishing Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'FISHING_XP_BOOST',
	},
	
	['Enchanting XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Enchanting/&3Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'ENCHANTING_XP_BOOST',
	},
	
	['Alchemy XP Boost'] = {
		maxLevel = 3,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+{0}☯ Alchemy Wisdom&7.',
		vars = {
			{5, 10, 20},
		},
		rarity = {'C', 'C', 'U'},
		duration = {'12:00', '24:00', '36:00'},
		id = 'ALCHEMY_XP_BOOST',
	},
	
	['Dungeon'] = {
		maxLevel = 7,
		color = 'Gold',
		composite = {
			{'Regeneration', {1, 2, 3, 3, 3, 4, 4}},
			{'Strength', {3, 3, 3, 4, 4, 4, 5}},
			{'Critical', {1, 1, 2, 2, 3, 3, 3}},
			{'Speed', {1, 2, 2, 2, 2, 3, 3}},
			{'Resistance', {1, 1, 2, 3, 4, 4, 5}},
			{'Archery', {-1, -1, -1, 1, 2, 3, 3}},
			duration = {'20:00', '40:00', '40:00', '40:00', '40:00', '40:00', '40:00'},
		},
		rarity = {'C', 'C', 'U', 'U', 'R', 'R', 'E'},
		id = 'DUNGEON',
	},
	
	['King\'s Scent'] = {
		maxLevel = 1,
		color = 'DarkGreen',
		ttColor = '2',
		desc = 'Grants the &astench &7of the/&5Goblin King&7.',
		rarity = {'C'},
		duration = '20:00',
	},

	['Obsidian Skin'] = {
		maxLevel = 1,
		color = 'Blue',
		ttColor = '9',
		desc = '&7Grants the user &atoughened/&askin &7that can resist the heat/&7of the &6Blazing Volcano&7.',
		--rarity = {},
		--duration = '',
	},

	['Coldfusion'] = {
		maxLevel = 1,
		color = 'Aqua',
		ttColor = 'b',
		desc = '',
		--rarity = {},
		--duration = '',
	},

	['Wisp\'s Ice-Flavored Water'] = {
		maxLevel = 1,
		color = 'Aqua',
		ttColor = 'b',
		desc = '&7Gain &c+10 Health Regen &7and &f+25/&fTrue Defense&7.',
		rarity = {'C'},
		duration = '5:00',
		id = 'WISP_ICE',
	},

	['Smoldering Polarization'] = {
		maxLevel = 1,
		color = 'Green',
		ttColor = 'a',
		desc = '&7Grants &3+10% Combat XP &7from/&7Blazes and pacifies nearby/&7Blazes while fighting &4Inferno/&4Demonlord&7.',
		--rarity = {},
		--duration = '1:00:00',
	},

	['Mushed Glowy Tonic'] = {
		maxLevel = 1,
		color = 'DarkGreen',
		ttColor = '2',
		desc = '&7Grants &b+30 Fishing Speed&7.',
		rarity = {'C'},
		duration = '1:00:00',
		id = 'MUSHED_GLOWY_TONIC',
	},

    ['Harvest Harbinger'] = {
    	maxLevel = 5,
    	color = 'Gold',
    	ttColor = '9',
    	desc = '&7Grants &6+50 Farming Fortune&7.',
    	rarity = {'R', 'R', 'R', 'R', 'R'},--Only level 5 is known to exist, assuming RARE for all for now
    	duration = '25:00',
		id = 'HARVEST_HARBINGER',
    },
    
    ['Poisoned Candy'] = {
    	maxLevel = 1,
    	color = 'Green',
    	ttColor = '2',
    	desc = 'Change me!//&8Tutti-Frutti',--Yes, it is actually "Change me" in game
    	rarity = {'C'},
    	duration = '00:00',--Can be drank or splashed but doesn't seem to have any effect or show up in /effects
    },
    
    ['Cold Resistance'] = {
    	maxLevel = 4,
    	color = 'Aqua',
    	ttColor = 'b',
    	desc = '&7Grants &b+{0} Cold Resistance&7.',
		vars = {
			{2.5, 5, 7.5, 10},
		},
		ingredients = { [1]='Enchanted Glacite', basePotion='Water Bottle' },
    	rarity = {'C', 'C', 'U', 'U'},
    	duration = '3:00',
		id = 'COLD_RESISTANCE',
    },
    
    ['Douce Pluie de Stinky Cheese'] = {
		maxLevel = 1,
		color = 'Gold',
		ttColor = 'f',
		desc = '&7Gain &2+20 Bonus Pest Chance&7.', 
		rarity = {'C'},
		duration = '1:00:00',
		id = 'STINKY_CHEESE',
	},
    
    ['Gravity'] = {
		maxLevel = 1,
		color = 'Dark Purple',
		ttColor = 'f',
		desc = '&7Increases &5Gravity &7around you,/&7spawning &bPuffs &7more often.',
		rarity = {'C'},
		duration = '10:00',
	},
    
    ['Jerry Candy'] = {
		maxLevel = 1,
		color = 'green',
		ttColor = 'a',
		desc = '&7Right-click to consume and/&7gain the &aJerry Effect &7(20:00):/&5 &c+100 Health/&5 &c+20 Strength/&5 &c+2 Ferocity/&5 &b+100 Intelligence/&5 &b+3 Magic Find',
		rarity = {'U'},
		duration = '20:00',
	},

    ['Secret'] = {
		maxLevel = 1,
		color = 'white',
		ttColor = 'f',
		desc = '&7&oAn enigmatic elixir steeped in/&7&omystery. One sip reveals the unseen,/&7&obut be wary, for not all secrets wish/&7&oto be known./&5/&8&l* &8Soulbound &8&l*',
		rarity = {'c'},
		duration = '??:??',
		id = 'SECRETS',
	}
}