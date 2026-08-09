return {
	-- Sorted alphabetically
	-- Sell price should be 0 if it can't be sold, nil if unknown
	['Ankylosaurus'] = {
		id = 'ANKYLOSAURUS',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 1.5 },
			{ name = 'Defense', bonus = 0.5 },
			{ name = 'True Defense', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Armored Tank',
				[2] = 'Unyielding',
				[3] = 'Clubbed Tail',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain {1} of your STAT_DEF as STAT_STR. {{Gray|(Max +500)}}',
				[2] = 'Increase the effectiveness of {{UltimateEnchantmentsLink|Last Stand}} and {{AttributeLink|Lifeline}} by {2}.',
				[3] = 'Every 5th hit deals {3} of your final damage to enemies within 5 blocks. Enemies hit deal 10% less damage for 10s.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a{1}% &7of your &a Defense &7as &c/&cStrength&7. &8(Max +500)',
				[2] = '&7Increase the effectiveness of &d&lLast/&d&lStand &7and &6Lifeline &7by &a{2}%&7.',
				[3] = '&7Every 5th hit deals &a{3}% &7of your/&7final damage to enemies within 5/&7blocks. Enemies hit deal 10% less/&7damage for 10s.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} more STAT_DEF per level',
				[2] = '+{2} higher effectiveness per level',
				[3] = '+{3} more damage per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl =  0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Ammonite'] = {
		id = 'AMMONITE',
		rarities = { 'L' },
		sellPrice = { 5000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Sea Creature Chance', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Heart of the Sea',
				[2] = 'Expert Cave Fisher',
				[3] = 'Gift of the Ammonite',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <DARK_AQUA>+</DARK_AQUA>{1}STAT_SCC to your pet for each <DARK_PURPLE>Heart of the Mountain</DARK_PURPLE> level.',
				[2] = 'Grants <BLUE>+</BLUE>{2}STAT_DHC for each <DARK_PURPLE>Heart of the Mountain</DARK_PURPLE> level while in the <DARK_PURPLE>Crystal Hollows</DARK_PURPLE>.',
				[3] = 'Each Mining and Fishing level grants <AQUA>+</AQUA>{3}STAT_FS, <WHITE>+</WHITE>{4}STAT_SPD and <GREEN>+</GREEN>{5}STAT_DEF.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &3+{1} Sea Creature/&3Chance &7to your pet for each/&5Heart of the Mountain &7level.',
				[2] = '&7Grants &9+{2} Double Hook Chance/&7for each &5Heart of the Mountain &7level/&7while in the &5Crystal Hollows&7.',
				[3] = '&7Each Mining and Fishing level grants/&b+{3} Fishing Speed&7,/&7&f+{4} Speed /&7and &a+{5}/&aDefense&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_SCC per level',
				[2] = '+{2} STAT_DHC per level',
				[3] = '+{4} STAT_FS, STAT_SPD, and STAT_DEF per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					base = 0,
					per_lvl = 0.01,
					color = 'Turquoise',
				},
				[2] = {
					base = 0,
					per_lvl = 0.005,
					color = 'Blue',
				},
				[3] = {
					base = 0,
					per_lvl = 0.005,
					color = 'Aqua',
				},
				[4] = {
					base = 0,
					per_lvl = 0.02,
					color = 'White',
				},
				[5] = {
					base = 0,
					per_lvl = 0.02,
					color = 'Green',
				},
			},
		},
	},

	['Armadillo'] = {
		id = 'ARMADILLO',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 100, 500, 1000, 2000, 5000, 10000 },
		petType = 'Mining Mount',
		stats = {
			{ name = 'Defense', bonus = 2 },
		},
		abilities = {
			name = {
				[1] = 'Ridable',
				[2] = 'Tunneller',
				[3] = 'Rolling Miner',
				[4] = 'Long Claws',
				[5] = 'Well-Worked',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Right-click your summoned pet to ride it! Moves faster based on your STAT_SPD.',
				[2] = 'While in the <DARK_PURPLE>Crystal Hollows</DARK_PURPLE>, this Pet breaks all blocks in its path using your held item.',
				[3] = 'Every {1} seconds, the next <LIGHT_PURPLE>Gemstone</LIGHT_PURPLE> you mine gives <GREEN>2x</GREEN> drops.',
				[4] = 'Grants {2} STAT_MSR while mining Hard Stone.',
				[5] = 'Consumes {3} less energy when tunneling.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Right-click your summoned pet to/&7ride it! Moves faster based on your/&f Speed&7.',
				[2] = '&7While in the &5Crystal Hollows&7, this Pet/&7breaks all blocks in its path using/&7your held item.',
				[3] = '&7Every &a{1} &7seconds, the next/&dGemstone &7you mine gives &a2x &7drops.',
				[4] = '&7Grants &e{2} Mining Spread &7while/&7mining Hard Stone.',
				[5] = '&7Consumes &e{3} &7less energy when/&7tunneling.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '{1} seconds per level',
				[4] = '+{2} STAT_MSR per level',
				[5] = '+{3} less energy per level',
			},
		},
		variables = {
			common = {
				ability_count = 2,
			},
			uncommon = {
				ability_count = 2,
			},
			rare = {
				ability_count = 3,
				[1] = {
					base = 60,
					per_lvl = -0.2,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 3,
				[1] = {
					base = 60,
					per_lvl = -0.3,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 4,
				[1] = {
					base = 60,
					per_lvl = -0.4,
					color = 'Green',
				},
				[2] = {
					base = 0,
					per_lvl = 3,
					color = 'Yellow',
				},
			},
			mythic = {
				ability_count = 5,
				[1] = {
					base = 60,
					per_lvl = -0.4,
					color = 'Green',
				},
				[2] = {
					base = 0,
					per_lvl = 3,
					color = 'Yellow',
				},
				[3] = {
					base = 0,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Baby Yeti'] = {
		id = 'BABY_YETI',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 1000000, 1250000, 1500000, 2000000, 2500000, 5000000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Fishing Speed', bonus = 0.5 },
			{ name = 'Sea Creature Chance', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Yeti Fury',
				[2] = 'Cold Breeze',
				[3] = 'Frosty Familiarity',
				[4] = 'Family Gathering',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Buffs the <GOLD>Yeti Sword</GOLD> by {1} STAT_DMG and STAT_INT and reduces its cooldown by {2}.',
				[2] = 'Increases <RED>Combat Stats</RED> and <AQUA>Fishing Stats</AQUA> by {3} while on <RED>Jerry\'s Workshop</RED>.',
				[3] = 'Grants <AQUA>+</AQUA>{4}STAT_MF against <WHITE>Winter Sea Creatures</WHITE>.',
				[4] = 'Grants {5}STAT_TRA while on <RED>Jerry\'s Workshop</RED>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Buffs the &6Yeti Sword &7by &a{1} &c/&cDamage &7and &b Intelligence &7and/&7reduces its cooldown by &a{2}%&7.',
				[2] = '&7Increases &cCombat Stats &7and &bFishing/&bStats &7by &a{3}% &7while on &cJerry\'s/Workshop&7.',
				[3] = '&7Grants &b+{4} Magic Find &7against/&fWinter Sea Creatures&7.',
				[4] = '&7Grants &d{5} Tracking &7while on/&cJerry\'s Workshop&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '<GREEN>+</GREEN>{1} more STAT_DMG and STAT_INT per level and <GREEN>+</GREEN>{2} more cooldown reduction',
				[2] = '<GREEN>+</GREEN>{3} more <RED>Combat</RED> and <AQUA>Fishing</AQUA> Stats',
				[3] = '<AQUA>+</AQUA>{4} more STAT_MF',
				[4] = '<LIGHT_PURPLE>+</LIGHT_PURPLE>{5} more STAT_TRA',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					color = 'Aqua',
				},
			},
			mythic = {
				stats = {
					{ name = 'Strength', bonus = 0.5 },
					{ name = 'Fishing Speed', bonus = 0.5 },
					{ name = 'Sea Creature Chance', bonus = 0.05 },
					{ name = 'Cold Resistance', bonus = 0.1 },
				},
				ability_count = 4,
				[1] = {
					per_lvl = 1.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					color = 'Aqua',
				},
				[5] = {
					per_lvl = 0.1,
					color = 'LightPurple',
				},
			},
		},
	},

	['Bal'] = {
		id = 'BAL',
		rarities = { 'E', 'L' },
		sellPrice = { 2000, 5000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Heat Resistance', bonus = 1.5 },
			{ name = 'Mining Fortune', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Furnace',
				[2] = 'Dispersion',
				[3] = 'Chimney',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants {1} STAT_PRISTINE while in the [[Magma Fields]].',
				[2] = 'While in the [[Crystal Hollows]], killing mobs reduces your STAT_HEAT by {2}.',
				[3] = 'Reduce Pickaxe Ability cooldowns by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &5+{1} Pristine &7while in the/&cMagma Fields&7.',
				[2] = '&7While in the &5Crystal Hollows&7, killing/&7mobs reduces your &c Heat &7by &c4&7.',
				[3] = '&7Reduce Pickaxe Ability cooldowns by/&a10%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_PRISTINE per level',
				[2] = '+{2} STAT_HEAT reduction per level',
				[3] = '+{3}% cooldown reduction per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.02,
					color = 'Purple',
				},
				[2] = {
					per_lvl = 0.04,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.03,
					color = 'Purple',
				},
				[2] = {
					per_lvl = 0.04,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				}
			},
		},
	},

	['Bat'] = {
		id = 'BAT',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 250, 5000, 10000, 25000, 50000, 100000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Speed', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Candy Lover',
				[2] = 'Nightmare',
				[3] = 'Wings of Steel',
				[4] = 'Sonar',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases drop chance of candies from mobs by {1}.',
				[2] = 'During night, gain {2} STAT_INT, {3} STAT_SPD, and {{Green|Night Vision}}.',
				[3] = 'Deals +{4} damage to {{Gold|Spooky}} enemies during the {{Gold|Spooky Festival}}.',
				[4] = 'Grants +{5} chance to catch {{Gold|Spooky Sea Creatures}} during the {{Gold|Spooky Festival}}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases drop chance of candies/&7from mobs by &a{1}%&7.',
				[2] = '&7During night, gain &a{2} &b Intelligence&7,/&a{3} &f Speed&7, and &aNight Vision&7.',
				[3] = '&7Deals &a+{4}% &7damage to &6Spooky/&7enemies during the &6Spooky Festival&7.',
				[4] = '&7Grants a &a+{5}% &7chance to catch/&6Spooky Sea Creatures &7during the/&6Spooky Festival&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance to drop Candy',
				[2] = '+{2} more STAT_INT per level; +{3} more STAT_SPD per level',
				[3] = '+{4} more damage per level',
				[4] = '+{5} higher chance to fish up {{Gold|Spooky Sea Creatures}}',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.4,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				stats = {
					{ name = 'Intelligence', bonus = 1 },
					{ name = 'Speed', bonus = 0.05 },
					{ name = 'Fishing Speed', bonus = 0.4 },					
					{ name = 'Sea Creature Chance', bonus = 0.05 },
				},
				ability_count = 4,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
						per_lvl = 0.3,
						color = 'Green',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[5] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Bee'] = {
		id = 'BEE',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 2500, 5000, 25000, 100000, 325000, 2500000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Strength', base = 5, bonus = 0.25 },
			{ name = 'Intelligence', bonus = 0.5 },
			{ name = 'Speed', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Hive',
				[2] = 'Busy Buzz Buzz',
				[3] = 'Honey Harvester',
				[4] = 'Powered by Pollen',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'For each player within <GREEN>25</GREEN> blocks:<br/><AQUA>+</AQUA>{1} STAT_INT<br/><RED>+</RED>{2} STAT_STR<br/><GREEN>+</GREEN>{3} STAT_DEF<br/><DARK_GRAY>Max 15 players</DARK_GRAY>',
				[2] = 'Grants <GREEN>+</GREEN>{4} of each to your pet:<br/>STAT_FMF<br/>STAT_FRF<br/>STAT_MNF',
				[3] = 'You have a {5} chance to find a <GREEN>Honey Jar</GREEN> when farming crops.',
				[4] = 'Grants {6} <GOLD>Sunflower</GOLD>, <GOLD>Moonflower</GOLD>, and <GOLD>Wild Rose Fortune</GOLD> while in <GREEN>The Garden</GREEN>.'
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7For each player within &a25 &7blocks:/&b +{1} Intelligence/&c +{2} Strength/&a +{3} Defense/&8Max 15 players',
				[2] = '&7Grants &a+{4} &7of each to your pet:/&6 Farming Fortune/&6 Foraging Fortune/&6 Mining Fortune',
				[3] = '&7You have a &a{5}% &7chance to find a/&aHoney Jar &7when farming crops.',
				[4] = '&7Grants &6+160 Sunflower&7,/&6Moonflower&7, and &6Wild Rose Fortune/&7while in &aThe Garden&7.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '{1} more STAT_INT per level, {2} more STAT_STR per level, {3} more STAT_DEF per level',
				[2] = '{4} more STAT_FMF, STAT_FRF, STAT_MNF per level',
				[3] = '+{5} higher chance to find {{ID|Honey Jar}} when farming crops',
				[4] = '{6} more Sunflower, Moonflower, and Wild Rose Fortune per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.02,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.02,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.01,
					base = 1,
					color = 'Green',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.05,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.04,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.02,
					base = 1,
					color = 'Green',
				},
			},
			rare = {
				stats = {
					{ name = 'Strength', base = 5, bonus = 0.25 },
					{ name = 'Intelligence', bonus = 0.5 },
					{ name = 'Speed', bonus = 0.1 },
					{ name = 'Mining Fortune', bonus = 0.2 },
					{ name = 'Foraging Fortune', bonus = 0.2 },
					{ name = 'Farming Fortune', bonus = 0.2 },
				},
				ability_count = 2,
				[1] = {
					per_lvl = 0.05,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.04,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.02,
					base = 1,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Green',
				},
			},
			epic = {
				stats = {
					{ name = 'Strength', base = 5, bonus = 0.25 },
					{ name = 'Intelligence', bonus = 0.5 },
					{ name = 'Speed', bonus = 0.1 },
					{ name = 'Mining Fortune', bonus = 0.25 },
					{ name = 'Foraging Fortune', bonus = 0.25 },
					{ name = 'Farming Fortune', bonus = 0.25 },
				},
				ability_count = 2,
				[1] = {
					per_lvl = 0.09,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.07,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.04,
					base = 1,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.3,
					color = 'Green',
				},
			},
			legendary = {
				stats = {
					{ name = 'Strength', base = 5, bonus = 0.25 },
					{ name = 'Intelligence', bonus = 0.5 },
					{ name = 'Speed', bonus = 0.1 },
					{ name = 'Mining Fortune', bonus = 0.3 },
					{ name = 'Foraging Fortune', bonus = 0.3 },
					{ name = 'Farming Fortune', bonus = 0.3 },
				},
				ability_count = 3,
				[1] = {
					per_lvl = 0.09,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.07,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.04,
					base = 1,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[5] = {
					per_lvl = 0.0002,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				stats = {
					{ name = 'Strength', base = 5, bonus = 0.25 },
					{ name = 'Intelligence', bonus = 0.5 },
					{ name = 'Speed', bonus = 0.1 },
					{ name = 'Mining Fortune', bonus = 0.4 },
					{ name = 'Foraging Fortune', bonus = 0.4 },
					{ name = 'Farming Fortune', bonus = 0.4 },
				},
				ability_count = 4,
				[1] = {
					per_lvl = 0.09,
					base = 1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.07,
					base = 1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.04,
					base = 1,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[5] = {
					per_lvl = 0.0002,
					color = 'Green',
					suffix = '%%',
				},
				[6] = {
					per_lvl = 1.6,
					color = 'Gold',
					suffix = '☘',
				}
			},
		},
	},

	['Bingo'] = {
		id = 'BINGO',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 0, 0, 0, 0, 0, 0 },
		petType = 'All Skills',
		isPassive = true,
		discloseXP = { 'common' }, -- only displays these rarities on XP table
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Strength', bonus = 0.25 },
			{ name = 'Speed', bonus = 0.75 },
		},
		abilities = {
			name = {
				[1] = 'Lucky Looting',
				[2] = 'Climber',
				[3] = 'Fast Learner',
				[4] = 'Chimera',
				[5] = 'Scavenger',
				[6] = 'Consumer',
				[7] = 'Power Of Completion',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain {1} more collection items from any source!',
				[2] = 'Gain {2} more HOTM and HOTF XP.',
				[3] = 'Gain {3} more Skill Experience and Slayer Experience',
				[4] = 'Increases the base stats of your active pet by {4}.',
				[5] = 'Gain {5} more coins per monster level on kill',
				[6] = 'Potion effects you obtain will have {6} more time.',
				[7] = 'Gain {{stat|str|+2}}, {{stat|cc|+1}}, and {{stat|hp|+5}} per completed Personal Bingo Goal in the current Bingo Event.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &c{1}% &7more collection/&7items from any source!',
				[2] = '&7Gain &c{2}% &7more &6HOTM&7 and &aHOTF&7 XP.',
				[3] = '&7Gain &c{3}% &7more Skill Experience and/&7Slayer Experience.',
				[4] = '&7Increases the base stats of your/&7active pet by &c{4}%&7.',
				[5] = '&7Gain &c{5} &7more coins per/&7monster level on kill',
				[6] = '&7Potion effects you obtain will have/&c{6} &7more time.',
				[7] = '&7Gain &c+2 Strength&7, &9+1/&9Crit Chance&7, and &c+5/&cHealth&7 per completed Personal/&7Bingo Goal in the current Bingo/&7Event.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more collection items per level',
				[2] = '+{2} more HOTM and HOTF XP per level',
				[3] = '+{3} more skill and slayer experience per level',
				[4] = '+{4} increases the base stats of your active pet per level',
				[5] = '+{5} more coins per monster level on kill per level',
				[6] = '+{6} more duration of effects per level',
				[7] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 2,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 3,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
				[3] = {
					base = 5,
					per_lvl = 0.1,
					color = "Red",
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 4,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
				[3] = {
					base = 5,
					per_lvl = 0.1,
					color = "Red",
					suffix = '%%',
				},
				[4] = {
					base = 10,
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 5,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
				[3] = {
					base = 5,
					per_lvl = 0.1,
					color = "Red",
					suffix = '%%',
				},
				[4] = {
					base = 10,
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
				[5] = {
					base = 0.1,
					per_lvl = 0.009,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 6,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
				[3] = {
					base = 5,
					per_lvl = 0.1,
					color = "Red",
					suffix = '%%',
				},
				[4] = {
					base = 10,
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
				[5] = {
					base = 0.1,
					per_lvl = 0.009,
					color = 'Red',
				},
				[6] = {
					base = 10,
					per_lvl = 0.4,
					color = 'Red',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 7,
				[1] = {
					base = 5,
					per_lvl = 0.2,
					color = "Red",
					suffix = '%%',
				},
				[2] = {
					base = 100,
					per_lvl = 1.5,
					color = "Red",
					suffix = '%%',
				},
				[3] = {
					base = 5,
					per_lvl = 0.1,
					color = "Red",
					suffix = '%%',
				},
				[4] = {
					base = 10,
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
				[5] = {
					base = 0.1,
					per_lvl = 0.009,
					color = 'Red',
				},
				[6] = {
					base = 10,
					per_lvl = 0.4,
					color = 'Red',
					suffix = '%%',
				},
			}
		},
	},

	['Black Cat'] = {
		id = 'BLACK_CAT',
		rarities = { 'L', 'M' },
		sellPrice = { 5000000, 10000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Speed', bonus = 1.25 },
			{ name = 'Magic Find', bonus = 0.15 },
			{ name = 'Pet Luck', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Hunter',
				[2] = 'Omen',
				[3] = 'Supernatural',
				[4] = 'Looting',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases your STAT_SPD and speed cap by {1}.',
				[2] = 'Grants {2} STAT_PL.',
				[3] = 'Grants {3} STAT_MF.',
				[4] = 'Gain {4} more collection items from monsters!',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases your speed and/&7speed cap by +&a{1}&7.',
				[2] = '&7Grants &a{2} &7&d Pet Luck&7.',
				[3] = '&7Grants &a{3} &7&b Magic Find&7.',
				[4] = '&7Gain &c{4}% &7more collection/&7items from monsters!',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_SPD per level.',
				[2] = '+{2} STAT_PL per level.',
				[3] = '+{3} STAT_MF per level.',
				[4] = '+{4} Looting per level.',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.15,
					color = 'Green',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.15,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.15,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Blaze'] = {
		id = 'BLAZE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 250000, 500000, 1000000, 2500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Defense', bonus = 0.3 },
			{ name = 'Intelligence', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Nether Embodiment',
				[2] = 'Bling Armor',
				[3] = 'Fusion-Style Potato',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases <RED>Combat</RED> and <LIGHT_PURPLE>Miscellaneous</LIGHT_PURPLE> stats by {1} while on the [[Crimson Isle|<RED>Crimson Isle</RED>]].',
				[2] = 'Upgrades [[Blaze Armor]] stats and ability by {2}.',
				[3] = 'Double effects of [[Hot Potato Book]]s.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases &cCombat &7and &dMiscellaneous/&7stats by &a{1}% &7while on the &cCrimson/&cIsle&7.',
				[2] = '&7Upgrades &cBlaze Armor &7stats/&7and ability by &a{2}%',
				[3] = '&7Double effects of hot potato/&7books.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher stats increase per level',
				[2] = '+{2} bigger [[Blaze Armor]] upgrade per level',
				[3] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.075,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.075,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Blue Whale'] = {
		id = 'BLUE_WHALE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Health', bonus = 2 },
		},
		abilities = {
			name = {
				[1] = 'Ingest',
				[2] = 'Bulk',
				[3] = 'Archimedes',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'If you have any absorption active, gain +{1} <GREEN>Damage Reduction</GREEN>.',
				[2] = 'Gain +{2} STAT_DEF per {3} <RED>Max</RED> STAT_HP.',
				[3] = 'Gain +{4} <RED>Max</RED> STAT_HP.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7If you have any absorption active,/&7gain &a+{1}% Damage Reduction&7.',
				[2] = '&7Gain &a{2}&a Defense &7per/&7&c{3} Max &c Health.',
				[3] = '&7Gain &c+{4}% Max &c Health.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more damage reduction with STAT_ABSORPTION',
				[2] = '+{2} more STAT_DEF per {3} Max STAT_HP',
				[3] = '+{4} higher STAT_HP boost per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Green',
				},
				[3] = { -- constant variable. Changes with rarities, but not with levels
					per_lvl = 0,
					base = 30,
					color = 'Red',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Green',
				},
				[3] = { -- constant variable. Changes with rarities, but not with levels
					per_lvl = 0,
					base = 25,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Green',
				},
				[3] = { -- constant variable. Changes with rarities, but not with levels
					per_lvl = 0,
					base = 20,
					color = 'Red',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Chicken'] = {
		id = 'CHICKEN',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 50, 500, 2500, 5000, 10000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Speed', bonus = 0.5 },
			{ name = 'Farming Fortune', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'Free Range',
				[2] = 'Eggstra Loot',
				[3] = 'Light Feet',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants +{1} STAT_FMF while on <AQUA>Public Islands</AQUA>.',
				[2] = 'Chickens always drop an Egg when killed. Grants a {2} chance for animals to drop an additional item.',
				[3] = 'Reduces fall damage by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &6+{1} Farming Fortune &7while/&7on &bPublic Islands&7.',
				[2] = '&7Chickens always drop an &fEgg &7when/&7killed. Grants a &a{2}% &7chance for/&7animals to drop an additional item.',
				[3] = '&7Reduces fall damage by &a{3}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_FMF per level',
				[2] = '+{2} higher chance per level',
				[3] = '+{3} less damage per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Gold',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.75,
					color = 'Gold',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 0.8,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Crow'] = {
		id = 'CROW',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 250000, 500000, 1000000, 2500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1.5 },
			{ name = 'Ability Damage', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Quick Hands',
				[2] = 'Camouflage',
				[3] = 'Insightful',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Lowers the cooldown of your abilities by +{1}.',
				[2] = 'After casting an ability, increase your STAT_DEF by +{2} for 20 seconds. Capped at 500 Defense.',
				[3] = 'Gives a {3} chance to not consume Mana when using an ability.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Lowers the cooldown of your/&7abilities by &a+{1}%&7.',
				[2] = '&7After casting an ability, increase/&7your &a Defense &7by &a+{2} &7for &b20/&bseconds&7./&8Capped at 500 Defense',
				[3] = '&7Gives a &a{3}% &7chance to not consume/&7Mana when using an ability.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '{1} lower cooldown',
				[2] = '{2} more STAT_DEF',
				[3] = '{3} chance to not consume mana',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 3,
					per_lvl = 0.07, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					base = 3,
					per_lvl = 0.07, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					base = 3,
					per_lvl = 0.07, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 5,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					base = 3,
					per_lvl = 0.12, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 5,
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 3,
					per_lvl = 0.12, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 5,
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					base = 3,
					per_lvl = 0.12, -- TODO: FIND REAL VALUE / FUNCTION
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Dolphin'] = {
		id = 'DOLPHIN',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 50000, 500000, 2500000, 10000000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Sea Creature Chance', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Pod Tactics',
				[2] = 'Echolocation',
				[3] = 'Splash Surprise',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <AQUA>+</AQUA>{1}STAT_FS for each player within <GREEN>30</GREEN> blocks, up to <GREEN>5</GREEN> players.',
				[2] = 'Grants {2} STAT_SCC.',
				[3] = 'Stun sea creatures for <GREEN>5s</GREEN> after fishing them up',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &b+{1} Fishing Speed/&7for each player within &a30/&7blocks, up to &a5 &7players.',
				[2] = '&7Grants &3+{2} Sea Creature/&3Chance.',
				[3] = '&7Stun sea creatures for &a5s/&a&7after fishing them up.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_FS per level',
				[2] = '+{2} higher sea creatures catch chance per level',
				[3] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.06,
					color = 'Aqua',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.08,
					color = 'Aqua',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.08,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.07,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.1,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
				},
			},
		},
	},

	['Eerie'] = {
		id = 'EERIE',
		rarities = { 'C', 'R', 'L' },
		sellPrice = { 0, 0, 0 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Speed', bonus = 0.1 },
			{ name = 'Intelligence', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'Fearnesy',
				[2] = 'Fearama',
				[3] = 'Fearcreasing',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '<DARK_PURPLE>Fear</DARK_PURPLE> from <DARK_PURPLE>Great Spook Armor</DARK_PURPLE> in your <AQUA>wardrobe</AQUA> applies to you, even if you aren\'t wearing it.',
				[2] = 'Increases <RED>damage</RED> dealt to Primal Fears and Spooky Mobs by <GREEN>1%</GREEN> for every <DARK_PURPLE>Fear</DARK_PURPLE> you have.',
				[3] = 'Gives <GREEN>+{1}</GREEN> <DARK_PURPLE>Fear</DARK_PURPLE> for every <GREEN>10</GREEN> <RED>Primal Fears</RED> killed, up to <GREEN>150</GREEN> <RED>Primal Fears</RED>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&5Fear &7from &5Great Spook Armor &7in/&7your &bwardrobe &7applies to you, even/&7if you aren\'t wearing it.',
				[2] = '&7Increases &cdamage &7dealt to Primal/&7Fears and Spooky Mobs by &a1% &7for/&7every &5Fear &7you have.',
				[3] = '&7Gives &a+{1} &5Fear &7for every &a10 &cPrimal/&cFears &7killed, up to &a150 &cPrimal Fears&7./&cPrimal Fear Kills&7: (&a0&7/&a150&7)',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+{1} STAT_FEAR per level.',
			},
		},
		variables = {
			common = {
				ability_count = 1,
			},
			rare = {
				ability_count = 2,
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 0.1,
					per_lvl = 0.003,
					color= 'Green',
				}
			},
		},
	},

	['Elephant'] = {
		id = 'ELEPHANT',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000, 10000000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Intelligence', bonus = 0.75 },
		},
		abilities = {
			name = {
				[1] = 'Stomp',
				[2] = 'Walking Fortress',
				[3] = 'Trunk Efficiency',
				[4] = 'Abundant Harvest',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain {1} STAT_DEF for every 100 STAT_SPD',
				[2] = 'Gain {2} STAT_HP for every <GREEN>10</GREEN> STAT_DEF',
				[3] = 'Grants <GOLD>+{3}</GOLD> STAT_FMF, which increases your chance for multiple drops.',
				[4] = 'Earn <DARK_GREEN>+{4} Sowdust</DARK_GREEN> while farming.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a{1} Defense &7for every/&7100 &f Speed&7.',
				[2] = '&7Gain &c{2} Health &7for every/&710 &a Defense&7.',
				[3] = '&7Grants &6+{3} Farming/&6Fortune, &7which increases your/&7chance for multiple drops.',
				[4] = '&7Earn &2+{4}% Sowdust &7while farming.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_DEF per level',
				[2] = '+{2} more STAT_HP per level',
				[3] = '+{3} more STAT_FMF per level',
				[4] = '+{4} more Sowdust per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Red',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Red',
				},
				[3] = {
					per_lvl = 1.5,
					color = 'Gold',
				},
			},
			mythic = {
				stats = {
					{ name = 'Health', bonus = 1 },
					{ name = 'Intelligence', bonus = 0.75 },
					{ name = 'Farming Fortune', bonus = 0.5 },
				},
				ability_count = 4,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Red',
				},
				[3] = {
					per_lvl = 1.5,
					color = 'Gold',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Dark_Green',
					suffix = '%%',
				},
			},
		},
	},

	['Ender Dragon'] = {
		id = 'ENDER_DRAGON',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 5000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Crit Chance', bonus = 0.1 },
			{ name = 'Crit Damage', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'End Strike',
				[2] = 'One with the Dragons',
				[3] = 'Superior',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Deal +{1} more damage to {{mt|Ender}} mobs.',
				[2] = 'Buffs the [[Aspect of the Dragons]] sword by {2} STAT_DMG and {3} STAT_STR.',
				[3] = 'Increases all <RED>Combat</RED> stats and STAT_MF by {4}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Deal &a{1}% &7more damage to &5 Ender/&7mobs.',
				[2] = '&7Buffs the &6Aspect of the Dragons/&7sword by &a{2} &c Damage &7and &a{3} &c/&cStrength&7.',
				[3] = '&7Increases all &cCombat &7stats and &b/&bMagic Find &7by &a{4}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more damage per level.',
				[2] = '+{2} more STAT_DMG and +{3} STAT_STR per level.',
				[3] = '+{4} higher bonus per level.',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Enderman'] = {
		id = 'ENDERMAN',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 100, 500, 2000, 10000, 1000000, 2500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Crit Damage', bonus = 0.75 },
		},
		abilities = {
			name = {
				[1] = 'Enderian',
				[2] = 'Teleport Savvy',
				[3] = 'Zealot Madness',
				[4] = 'Enderman Slayer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Take {1} less damage from {{mt|Ender}} mobs.',
				[2] = 'Buffs the Transmission ability granting {2} STAT_DMG for 5s on use.',
				[3] = 'Increases your odds to find a special [[Zealot]] by {3}.',
				[4] = 'Gain {4} Combat XP against <GREEN>Endermen</GREEN>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Take &a{1}% &7less damage from &5 Ender /&7mobs',
				[2] = '&7Buffs the Transmission abilities, granting /&a{2} &7weapon damage for 5s on use',
				[3] = '&7Increases your odds to find a/&7special Zealot by &a{3}%&7.',
				[4] = '&7Gain &b{4}x &7Combat XP against &aEndermen&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} less damage per level',
				[2] = '+{2} more STAT_DMG per level',
				[3] = '+{3} higher chance per level',
				[4] = '+{4} more Combat XP per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					base = 1.0,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
			},
		},
	},

	['Endermite'] = {
		id = 'ENDERMITE',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 250, 5000, 10000, 25000, 50000, 100000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1.5 },
			{ name = 'Pet Luck', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'More Stonks',
				[2] = 'Daily Commuter',
				[3] = 'Mite Bait',
				[4] = 'Sacrificer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain more exp orbs for breaking end stone and gain a +{1} chance to get an extra block dropped.',
				[2] = '<BLUE>Transmission Abilities</BLUE> cost {2} less mana.',
				[3] = 'Gain a {3} chance to dig up a bonus <RED>Nest Endermite</RED> per <LIGHT_PURPLE>+1</LIGHT_PURPLE>STAT_PL <DARK_GRAY>(Stacks above 100%).</DARK_GRAY>',
				[4] = 'Increases the odds of rolling for bonus items in the <RED>Draconic Altar</RED> by {4}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain more exp orbs for/&7breaking end stone and gain a/&7+&a{1}% &7chance to get an extra/&7block dropped.',
				[2] = '&9Transmission Abilities/&7cost &a{2}% &7less mana.',
				[3] = '&7Gain a &a{3}% &7chance to dig up/&7a bonus &cNest Endermite &7per/&d+1 Pet Luck &8(Stacks above/&8100%).',
				[4] = '&7Increases the odds of rolling/&7for bonus items in the/&cDraconic Altar &7by &a{4}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance to drop an extra block per level',
				[2] = '+{2} less {{stat|mana}} per level',
				[3] = '+{3} chance to dig up a bonus <RED>Nest Endermite</RED> per level',
				[4] = '+{4} increased odds of rolling for bonus items in the <RED>Draconic Altar</RED> per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.8,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.8,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.03,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.03,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Flying Fish'] = {
		id = 'FLYING_FISH',
		rarities = { 'R', 'E', 'L', 'M' },
		sellPrice = { 1000, 100000, 250000, 5000000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Defense', bonus = 0.5 },
			{ name = 'Strength', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'Quick Reel',
				[2] = 'Water Bender',
				[3] = 'Deep Sea Diver',
				[4] = 'Lava Bender',
				[5] = 'Magmatic Diver',
				[6] = 'Rapid Decay',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <AQUA>+</AQUA>{1} STAT_FS.',
				[2] = 'Gives {2} STAT_STR and STAT_DEF when near water.',
				[3] = 'Increases the stats of [[Diver Armor]] and [[Abyssal Armor]] by {3}.',
				[4] = 'Gives {4} STAT_STR and STAT_DEF when near lava.',
				[5] = 'Increases the stats of [[Diver Armor]], [[Magma Lord Armor]], and [[Abyssal Armor]] by {5}.',
				[6] = 'Increases the chance to activate {{UltimateEnchantmentsLink|Flash}} Enchantment by {6}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &b+{1} Fishing Speed&7.',
				[2] = '&7Gives &a{2} &c Strength &7and &a Defense &7/&7when near water.',
				[3] = '&7Increases the stats of &aDiver Armor/&7and &aAbyssal Armor &7by &a{3}%',
				[4] = '&7Gives &a{4} &c Strength &7and/&7&a Defense &7when near lava.',
				[5] = '&7Increases the stats of Magma/&7Lord armor by &a{5}%',
				[6] = '&7Increases the chance to/&7activate the &d&lFlash/&d&lEnchantment&a by {6}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_FS per level',
				[2] = '+{2} more STAT_STR and STAT_DEF per level',
				[3] = '+{3} higher stat increase per level',
				[4] = '+{4} more STAT_STR and STAT_DEF per level',
				[5] = '+{5} higher stat increase per level',
				[6] = '+{6} higher chance for activation',
			},
		},
		variables = {
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.6,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.8,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.75,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.8,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				petimage = 'Flying Fish Pet (Mythic)',
				ability_indices = {1, 4, 5, 6},
				[1] = {
					per_lvl = 0.8,
					color = 'Aqua',
				},
				[4] = {
					per_lvl = 1,
					color = 'Green',
				},
				[5] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[6] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Frog'] = {
		id = 'FROG',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 100, 500, 1000, 2000, 5000, 10000 },
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Strength', base = 30 },
			{ name = 'Speed', bonus = 0.5 },
			{ name = 'Fishing Speed', bonus = 0.4 },
			{ name = 'Respiration', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Hunting Enjoyer',
				[2] = 'Hunting Enjoyer',
				[3] = 'Hunting Enjoyer',
				[4] = 'Hop',
				[5] = 'Happy Tree Friends',
				[6] = 'Happy Tree Friends',
				[7] = 'Home Sweet Home',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases your chance to catch <DARK_GREEN>Forest</DARK_GREEN> Shards by {1}.',
				[2] = 'Increases your chance to catch <DARK_GREEN>Forest</DARK_GREEN> and <AQUA>Water</Aqua> Shards by {1}.',
				[3] = 'Increases your chance to catch <DARK_GREEN>Forest</DARK_GREEN>, <AQUA>Water</Aqua>, and <RED>Combat</RED> Shards by {1}.',
				[4] = 'Grants {2} STAT_FORF for <YELLOW>20</YELLOW> seconds every time you jump.',
				[5] = 'Grants {3} STAT_FORF for every other <DARK_GREEN>Frog Pet</DARK_GREEN> on the island, up to <AQUA>10</AQUA> frogs.',
				[6] = 'Grants {4} STAT_FORF and <AQUA>+</AQUA>{5} STAT_FS for every other <DARK_GREEN>Frog Pet</DARK_GREEN> on the island, up to <AQUA>10</AQUA> frogs.',
				[7] = "Increases your chance of catching '''<GOLD>GOLD</GOLD>''' and '''<AQUA>DIAMOND</AQUA>''' <DARK_GREEN>Trophy Frogs</DARK_GREEN> by {6}.",
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases your chance to catch/&2Forest &7Shards by &a{1}%&7.',
				[2] = '&7Increases your chance to catch/&2Forest &7and &bWater &7Shards by &a{1}%&7.',
				[3] = '&7Increases your chance to catch/&2Forest&7, &bWater&7, and &cCombat &7Shards by/&a{1}%&7.',
				[4] = '&7Grants&6 {2} Foraging Fortune &7for/&e20 &7seconds every time you jump.',
				[5] = '&7Grants&6 {3} Foraging Fortune &7for/&7every other &2Frog Pet &7on the island,/&7up to &b10 &7frogs.',
				[6] = '&7Grants&6 {4} Foraging Fortune &7and/&b{5} Fishing Speed&7 for every other/&2Frog Pet &7on the island, &7up to &b10/&7frogs.',
				[7] = '&7Increases your chance of catching/&6&lGOLD &7and &b&lDIAMOND &2Trophy Frogs/&7by &a{6}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance to catch <DARK_GREEN>Forest</DARK_GREEN> Shards per level',
				[2] = '+{1} higher chance to catch <DARK_GREEN>Forest</DARK_GREEN> and <AQUA>Water</AQUA> Shards per level',
				[3] = '+{1} higher chance to catch <DARK_GREEN>Forest</DARK_GREEN>, <AQUA>Water</AQUA>, and <RED>Combat</RED> Shards per level',
				[4] = '+{2} more STAT_FORF per level',
				[5] = '+{3} more STAT_FORF per level',
				[6] = '+{4} more STAT_FORF and +{8} more STAT_FS per level',
				[7] = "+{6} higher chance to catch '''<GOLD>GOLD</GOLD>''' and '''<AQUA>DIAMOND</AQUA>''' <DARK_GREEN>Trophy Frogs</DARK_GREEN> per level",
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
			},
			uncommon = {
				ability_indices = {2},
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
			},
			rare = {
				ability_indices = {3},
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
			},
			epic = {
				ability_indices = {3, 4},
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
				[2] = {
					base = 1.0,
					per_lvl = 0.79,
					color = 'Gold',
				},
			},
			legendary = {
				ability_indices = {3, 4, 5},
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
				[2] = {
					base = 1.0,
					per_lvl = 0.79,
					color = 'Gold',
				},
				[3] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Gold',
				},
			},
			mythic = {
				stats = {
					{ name = 'Strength', base = 30 },
					{ name = 'Speed', bonus = 0.5 },
					{ name = 'Fishing Speed', bonus = 0.4 },
					{ name = 'Respiration', bonus = 0.1 },
					{ name = 'Trophy Chance', bonus = 0.05 },
				},
				ability_indices = {3, 4, 6, 7},
				[1] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Green',
					suffix = '%%',
					round_down = true,
				},
				[2] = {
					base = 1.0,
					per_lvl = 0.79,
					color = 'Gold',
				},
				[4] = {
					base = 1.0,
					per_lvl = 0.09,
					color = 'Gold',
				},
				[5] = {
					-- Shows 0.12 FS at 1 -> 2 FS at 100
					base = 0.1,
					per_lvl = 0.019,
					color = 'Aqua',
				},
				[6] = {
					base = 0.0,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				-- bonus_desc fix
				[8] = {
					per_lvl = 0.02,
					color = 'Aqua',
				},
			},
		},
	},

	['Ghoul'] = {
		id = 'GHOUL',
		rarities = { 'E', 'L' },
		sellPrice = { 2000, 100000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Ferocity', bonus = 0.05 },
			{ name = 'Intelligence', bonus = 0.75 },
			{ name = 'Vitality', bonus = 0.15 },
			{ name = 'Mending', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Undead Slayer',
				[2] = 'Army of the Dead',
				[3] = 'Reaper Soul',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain {1} Combat XP against <GREEN>Zombies</GREEN>.',
				[2] = 'Increases the amount of souls you can store by <GREEN>2</GREEN> and the chance of getting a mob\'s soul by {2}.',
				[3] = 'Reduces the summoning cost of mobs by {3} and increases their damage output by {4}. Increases the health of all summoned mobs by {5}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &b{1}x &7Combat XP against &aZombies&7.',
				[2] = '&7Increases the amount of souls you/&7can store by &a2 &7and the chance of/&7getting a mob\'s soul by &a{2}%',
				[3] = '&7Reduces the summoning cost of mobs/&7by &a{3}% &7and increases their damage/&7output by &a{4}%&7. Increases the health/&7of all summoned mobs by &a{5}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more Combat XP per level',
				[2] = '+{2} chance to get a mob\'s soul per level',
				[3] = '-{3} cost to summon a mob, increasing their damage output by {4} and the health by {5} per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					base = 1.0,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 1.0,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[5] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Giraffe'] = {
		id = 'GIRAFFE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000 },
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Crit Chance', bonus = 0.05 },
			{ name = 'Swing Range', bonus = 0.01 },
		},
		abilities = {
			name = {
				[1] = 'Good Heart',
				[2] = 'Higher Ground',
				[3] = 'Long Neck',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <RED>+</RED>{1} STAT_HR.',
				[2] = 'Increases your STAT_CD and STAT_STR by <RED>{2}%</RED> for every <YELLOW>0.1</YELLOW> STAT_SR over <YELLOW>3</YELLOW> (up to <YELLOW>6</YELLOW>).',
				[3] = 'Increases your melee damage by <RED>{3}</RED> if you are more than 3 blocks away from the target.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &c+{1} Health Regen&7.',
				[2] = '&7Increases your &9 Crit Damage &7and/&c Strength &7by &c{2}% &7for every/&e0.1 Swing Range &7over &e3 &7(up to /&e6&7).',
				[3] = '&7Increases your melee damage by/&c{3} &7if you are more than 3 blocks/&7away from the target.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher STAT_HR per level',
				[2] = '+{2}% more STAT_STR and STAT_CD per level',
				[3] = '+{3} more damage increase per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 1,
					per_lvl = 0.49,
					color = 'Red',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					base = 35,
					per_lvl = 0.35,
					color = 'Red',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					base = 35,
					per_lvl = 0.35,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.0015,
					color = 'Red',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					base = 50,
					per_lvl = 0.5,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.0015,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 50,
					per_lvl = 0.5,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.0015,
					color = 'Red',
				},
				[3] = {
					base = 50,
					per_lvl = 0.5,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Glacite Golem'] = {
		id = 'GLACITE_GOLEM',
		rarities = { 'C', 'U', 'R', 'E' , 'L' },
		sellPrice = { 10000, 250000, 500000, 1000000, 2500000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Cold Resistance', bonus = 0.1 },
			{ name = 'Mining Speed', bonus = 1.25 },
		},
		abilities = {
			name = {
				[1] = 'Powder-powered',
				[2] = 'Iceborn',
				[3] = 'Frozen Perfection',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <GREEN>+</GREEN>{1} more {{Glacite Powder}} from most sources.',
				[2] = 'Gain <GREEN>+</GREEN>{2} STAT_MNF while in the [[Glacite Mineshafts]].',
				[3] = 'Gain <GREEN>+</GREEN>{3} STAT_PRIS fore every [[Frozen Corpse]] you\'ve looted in the current [[Glacite Mineshaft]].',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a+{1}%&7 more &bGlacite Powder &7from/&7most sources.',
				[2] = '&7Gain &a+{2} &6 Mining Fortune &7while in the/&bGlacite Mineshafts&7.',
				[3] = '&7Gain &a+{3} &5 Pristine &7for every/&bFrozen Corpse &7you\'ve looted in the/&7current &bGlacite Mineshaft&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} more {{Glacite Powder}} per level',
				[2] = '+{2} more STAT_MNF per level',
				[3] = '+{3} more STAT_PRIS per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.75,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.01,
					color = 'Green',
				},
			},
		},
	},

	['Goblin'] = {
		id = 'GOBLIN',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Magic Find', bonus = 0.07 },
			{ name = 'Ore Fortune', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Grunt Work',
				[2] = 'Fetid Thief',
				[3] = 'Free-range Eggs',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain +{1} STAT_MS when mining <GOLD>Ores</GOLD>.',
				[2] = 'Gain +{2} STAT_MSR while in the <DARKGREEN>Mines of Divan</DARKGREEN>.',
				[3] = 'Increases the chance of finding rare goblin eggs by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &6+{1} Mining Speed &7when mining/&6Ores&7.',
				[2] = '&7Gain &e+{2} Mining Spread &7while in the/&2Mines of Divan&7.',
				[3] = '&7Increases the chance of finding/&7rare goblin eggs by &a{3}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} more STAT_MS per level',
				[2] = '+{2} more STAT_MSR per level',
				[3] = '+{3} higher chance per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 2.5,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 1,
					color = 'Yellow',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Golden Dragon'] = {
		id = 'GOLDEN_DRAGON',
		rarities = { 'L' },
		sellPrice = { 5000 },
		petType = 'Combat Pet',
		levels = '100-200',
		stats = {
			{ name = 'Strength', base = 25, bonus = 0.25 },
			{ name = 'Attack Speed', base = 25, bonus = 0.25 },
			{ name = 'Magic Find', base = 5, bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Gold\'s Power',
				[2] = 'Shining Scales',
				[3] = 'Dragon\'s Greed',
				[4] = 'Legendary Treasure',
				[5] = 'Symbiosis',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increase the potency of <GOLD>Midas\' Sword</GOLD> and <GOLD>Midas Staff\'s</GOLD> <DARK_PURPLE>Greed Ability</DARK_PURPLE> by {1}',
				[2] = 'Grants +<span title="Exactly 100/9"><RED>11.1</RED></span> STAT_STR and +<span title="Exactly 20/9"><AQUA>2.2</AQUA></span> STAT_MF to your pet for each digit in your <GOLD>Gold Collection</GOLD>. <DARK_GRAY>(Max 100M collection)</DARK_GRAY>',
				[3] = 'Grants +{2} STAT_STR per <AQUA>5</AQUA> STAT_MF. <DARK_GRAY>(Max +{4})</DARK_GRAY>',
				[4] = 'Gain {3} STAT_DMG for every million coins in your bank. <DARK_GRAY>(Max {5})</DARK_GRAY>',
				[5] = 'If you own a level <GREEN>200 Golden Dragon</GREEN>, gain <GOLD>+5 coins</GOLD> per monster kill for every other unique maxed Combat Pet that you own.'
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increase the potency of &6Midas\'/&6Sword &7and &6Midas Staff\'s &5Greed Ability/&7by &a{1}%',
				[2] = '&7Grants &c+11.1 Strength &7and &b+2.2/&bMagic Find &7to your pet for each digit/&7in your &6Gold Collection&7./&8(Max 100M collection)',
				[3] = '&7Grants &c+{2}% &c Strength &7per &b5/&bMagic Find&7. &8(Max +5%)',
				[4] = '&7Gain &c{3}% &7damage for every million/&7coins in your bank. &8(Max 250%)',
				[5] = '&7If you own a level &a200 Golden/&aDragon&7, gain &6+5 coins &7per monster/&7kill for every other unique maxed/&7Combat Pet that you own.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} per level',
				[2] = nil,
				[3] = '+{2} Strength per Magic Find per level',
				[4] = '+{3} more damage per level',
				[5] = nil,
			},
		},
		variables = {
			legendary = {
				ability_count = 5,
				[1] = {
					base = 5,
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',					
				},
				[2] = {
					base = 0.25,
					per_lvl = 0.0025,
					color = 'Red',
					suffix = '%%',
				},
				[3] = {
					base = 0.125,
					per_lvl = 0.00125,
					color = 'Red',
					suffix = '%%',					
				},
				[4] = {
					base = 2.5,
					per_lvl = 0.025,
					color = 'Dark Gray',
					suffix = '%%',					
				},
				[5] = {
					base = 125,
					per_lvl = 1.25,
					color = 'Dark Gray',
					suffix = '%%',					
				},				
			},
		},
	},

	['Golem'] = {
		id = 'GOLEM',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 2500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 1.5 },
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Swing Range', bonus = 0.01 },
		},
		abilities = {
			name = {
				[1] = 'Last Stand',
				[2] = 'Ricochet',
				[3] = 'Toss',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'While at less than <GREEN>20% HP</GREEN>, reduce incoming damage by <GREEN>20%</GREEN>. Additionally, gain a temporary shield equal to <GREEN>40%</GREEN> of your maximum health and deal <GREEN>40%</GREEN> more damage.<br/><DARKGRAY>(Lasts 12s, 60s cooldown)</DARKGRAY>',
				[2] = 'Your iron plating causes {1} of attacks to ricochet and hit the attacker.',
				[3] = 'Every 5 hits, throw the enemy up into the air and deal <GREEN>5x</GREEN> damage <DARKGRAY>(5s cooldown).</DARKGRAY>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7While at less than &a20% HP&7, reduce/&7incoming damage by &a20%&7. Additionally,/&7gain a temporary shield equal to &a40%/&7of your maximum health and deal &a40%/&7more damage./&8(Lasts 12s, 60s cooldown)',
				[2] = '&7Your iron plating causes &a{1}% &7of/&7attacks to ricochet and hit the/&7attacker.',
				[3] = '&7Every 5 hits, throw the enemy up into/&7the air and deal &a5x &7damage &8(5s cooldown).',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more attacks can ricochet',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Grandma Wolf'] = {
		id = 'GRANDMA_WOLF',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 10000, 25000, 50000, 200000 },
		petType = 'Combat Pet',
		isPassive = true,
		stats = {
			{ name = 'Strength', bonus = 0.25 },
			{ name = 'Health', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Kill Combo',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain buffs for combo kills. Effects stack as you increase your combo.<br/>{{Bull}}<GREEN>5 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{1}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKGRAY>+</DARKGRAY><AQUA>{7}</AQUA> STAT_MF<br/>{{Bull}}<GREEN>10 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{2}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKGRAY>+</DARKGRAY><GOLD>{8} coins per kill</GOLD><br/>{{Bull}}<GREEN>15 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{3}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKGRAY>+</DARKGRAY><AQUA>{9} STAT_MF</AQUA><br/>{{Bull}}<GREEN>20 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{4}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKAQUA>+</DARKAQUA>{10} STAT_CW<br/>{{Bull}}<GREEN>25 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{5}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKGRAY>+</DARKGRAY><AQUA>{7}</AQUA> STAT_MF<br/>{{Bull}}<GREEN>30 Combo</GREEN> <DARKGRAY>(lasts</DARKGRAY> <GREEN>{6}s</GREEN><DARKGRAY>)</DARKGRAY>{{Bull}}<DARKGRAY>+</DARKGRAY><GOLD>{8} coins per kill</GOLD>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain buffs for combo kills./&7Effects stack as you increase/&7your combo.//&a5 Combo &8(lasts &a{1}s&8)/  &8+&b{7}% &b Magic Find/&a10 Combo &8(lasts &a{2}s&8)/  &8+&6{8} &7coins per kill/&a15 Combo &8(lasts &a{3}s&8)/  &8+&b{9}% &b Magic Find/&a20 Combo &8(lasts &a{4}s&8)/  &8+&3{10}☯ Combat Wisdom/&a25 Combo &8(lasts &a{5}s&8)/  &8+&b{7}% &b Magic Find/&a30 Combo &8(lasts &a{6}s&8)/  &8+&6{8} &7coins per kill',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1}/{2}/{3}/{4}/{5}/{6}s increase in combo duration for 5/10/15/20/25/30 combos per level.',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = { -- 5 kill combo
					per_lvl = 0.02,
					base = 8,
					color = 'Green',
				},
				[2] = { -- 10 kill combo
					per_lvl = 0.02,
					base = 6,
					color = 'Green',
				},
				[3] = { -- 15 kill combo
					per_lvl = 0.02,
					base = 4,
					color = 'Green',
				},
				[4] = { -- 20 kill combo
					per_lvl = 0.02,
					base = 3,
					color = 'Green',
				},
				[5] = { -- 25 kill combo
					per_lvl = 0.01,
					base = 3,
					color = 'Green',
				},
				[6] = { -- 30 kill combo
					per_lvl = 0.01,
					base = 2,
					color = 'Green',
				},
				[7] = { -- Magic Find 1
					per_lvl = 0,
					base = 1,
					color = 'Aqua',
					suffix = '%%',
				},
				[8] = { -- Coins 1
					per_lvl = 0,
					base = 2,
					color = 'Gold',
				},
				[9] = { -- Magic Find 2
					per_lvl = 0,
					base = 1,
					color = 'Aqua',
					suffix = '%%',
				},
				[10] = { -- Combat XP
					per_lvl = 0,
					base = 5,
					color = 'DarkAqua',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = { -- 5 kill combo
					per_lvl = 0.02,
					base = 8,
					color = 'Green',
				},
				[2] = { -- 10 kill combo
					per_lvl = 0.02,
					base = 6,
					color = 'Green',
				},
				[3] = { -- 15 kill combo
					per_lvl = 0.02,
					base = 4,
					color = 'Green',
				},
				[4] = { -- 20 kill combo
					per_lvl = 0.02,
					base = 3,
					color = 'Green',
				},
				[5] = { -- 25 kill combo
					per_lvl = 0.01,
					base = 3,
					color = 'Green',
				},
				[6] = { -- 30 kill combo
					per_lvl = 0.01,
					base = 2,
					color = 'Green',
				},
				[7] = { -- Magic Find 1
					per_lvl = 0,
					base = 1,
					color = 'Aqua',
					suffix = '%%',
				},
				[8] = { -- Coins 1
					per_lvl = 0,
					base = 4,
					color = 'Gold',
				},
				[9] = { -- Magic Find 2
					per_lvl = 0,
					base = 2,
					color = 'Aqua',
					suffix = '%%',
				},
				[10] = { -- Combat XP
					per_lvl = 0,
					base = 7,
					color = 'DarkAqua',
				},
			},
			rare = {
				ability_count = 1,
				[1] = { -- 5 kill combo
					per_lvl = 0.02,
					base = 8,
					color = 'Green',
				},
				[2] = { -- 10 kill combo
					per_lvl = 0.02,
					base = 6,
					color = 'Green',
				},
				[3] = { -- 15 kill combo
					per_lvl = 0.02,
					base = 4,
					color = 'Green',
				},
				[4] = { -- 20 kill combo
					per_lvl = 0.02,
					base = 3,
					color = 'Green',
				},
				[5] = { -- 25 kill combo
					per_lvl = 0.01,
					base = 3,
					color = 'Green',
				},
				[6] = { -- 30 kill combo
					per_lvl = 0.01,
					base = 2,
					color = 'Green',
				},
				[7] = { -- Magic Find 1
					per_lvl = 0,
					base = 2,
					color = 'Aqua',
					suffix = '%%',
				},
				[8] = { -- Coins 1
					per_lvl = 0,
					base = 6,
					color = 'Gold',
				},
				[9] = { -- Magic Find 2
					per_lvl = 0,
					base = 2,
					color = 'Aqua',
					suffix = '%%',
				},
				[10] = { -- Combat XP
					per_lvl = 0,
					base = 9,
					color = 'DarkAqua',
				},
			},
			epic = {
				ability_count = 1,
				[1] = { -- 5 kill combo
					per_lvl = 0.02,
					base = 8,
					color = 'Green',
				},
				[2] = { -- 10 kill combo
					per_lvl = 0.02,
					base = 6,
					color = 'Green',
				},
				[3] = { -- 15 kill combo
					per_lvl = 0.02,
					base = 4,
					color = 'Green',
				},
				[4] = { -- 20 kill combo
					per_lvl = 0.02,
					base = 3,
					color = 'Green',
				},
				[5] = { -- 25 kill combo
					per_lvl = 0.01,
					base = 3,
					color = 'Green',
				},
				[6] = { -- 30 kill combo
					per_lvl = 0.01,
					base = 2,
					color = 'Green',
				},
				[7] = { -- Magic Find 1
					per_lvl = 0,
					base = 2,
					color = 'Aqua',
					suffix = '%%',
				},
				[8] = { -- Coins 1
					per_lvl = 0,
					base = 8,
					color = 'Gold',
				},
				[9] = { -- Magic Find 2
					per_lvl = 0,
					base = 3,
					color = 'Aqua',
					suffix = '%%',
				},
				[10] = { -- Combat XP
					per_lvl = 0,
					base = 12,
					color = 'DarkAqua',
				},
			},
			legendary = {
				ability_count = 1,
				[1] = { -- 5 kill combo
					per_lvl = 0.02,
					base = 8,
					color = 'Green',
				},
				[2] = { -- 10 kill combo
					per_lvl = 0.02,
					base = 6,
					color = 'Green',
				},
				[3] = { -- 15 kill combo
					per_lvl = 0.02,
					base = 4,
					color = 'Green',
				},
				[4] = { -- 20 kill combo
					per_lvl = 0.02,
					base = 3,
					color = 'Green',
				},
				[5] = { -- 25 kill combo
					per_lvl = 0.01,
					base = 3,
					color = 'Green',
				},
				[6] = { -- 30 kill combo
					per_lvl = 0.01,
					base = 2,
					color = 'Green',
				},
				[7] = { -- Magic Find 1
					per_lvl = 0,
					base = 3,
					color = 'Aqua',
					suffix = '%%',
				},
				[8] = { -- Coins 1
					per_lvl = 0,
					base = 10,
					color = 'Gold',
				},
				[9] = { -- Magic Find 2
					per_lvl = 0,
					base = 3,
					color = 'Aqua',
					suffix = '%%',
				},
				[10] = { -- Combat XP
					per_lvl = 0,
					base = 15,
					color = 'DarkAqua',
				},
			},
		},
	},

	['Griffin'] = {
		id = 'GRIFFIN',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 100, 500, 1000, 500000, 2500000, 10000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Crit Chance', bonus = 0.1 },
			{ name = 'Crit Damage', bonus = 0.5 },
			{ name = 'Attack Speed', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Odyssey',
				[2] = 'Sacred Strength',
				[3] = 'King of Kings',
				[4] = 'Ancient Earth',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '{1} types of <DARKGREEN>Mythological</DARKGREEN> can spawn from <YELLOW>Griffin Burrows</YELLOW>. Their stats scale with your Griffin\'s rarity.',
				[2] = 'Gain <RED>+</RED>{2} STAT_STR when above <RED>85%</RED> health.',
				[3] = 'Grants <AQUA>+{3}</AQUA> STAT_MF on <DARKGREEN>Mythological</DARKGREEN> mobs.',
				[4] = 'Grants <PINK>+{4}</PINK> STAT_TRA on <YELLOW>Griffin Burrows</YELLOW> for each burrow excavated in your current chain.'
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&c{1} &7types of &2 Mythological &7can/&7spawn from &eGriffin Burrows&7. Their/&7stats scale with your Griffin\'s/&7rarity.',
				[2] = '&7Gain &c+{2}% &c Strength/&7when above &c85% &7health.',
				[3] = '&7Grants &b+{3}  Magic Find &7on &2/&2Mythological &7mobs.',
				[4] = '&7Grants &d+{4}  Tracking &7on &eGriffin/&eBurrows &7for each burrow excavated/&7in your current chain.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = '+{2} more STAT_STR per level',
				[3] = '+{3} more STAT_MF per level',
				[4] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 2,
					per_lvl = 0,
					color = 'Red',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					base = 4,
					per_lvl = 0,
					color = 'Red',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					base = 6,
					per_lvl = 0,
					color = 'Red',
				},
				[2] = {
					base = 0,
					per_lvl = 0.15,
					color = 'Red',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					base = 8,
					per_lvl = 0,
					color = 'Red',
				},
				[2] = {
					base = 0,
					per_lvl = 0.15,
					color = 'Red',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 10,
					per_lvl = 0,
					color = 'Red',
				},
				[2] = {
					base = 0,
					per_lvl = 0.15,
					color = 'Red',
					suffix = '%%',
				},
				[3] = {
					base = 0,
					per_lvl = 0.2,
					color = 'Aqua',
				}
			},
			mythic = {
				ability_count = 4,
				[1] = {
					base = 12,
					per_lvl = 0,
					color = 'Red',
				},
				[2] = {
					base = 0,
					per_lvl = 0.15,
					color = 'Red',
					suffix = '%%',
				},
				[3] = {
					base = 0,
					per_lvl = 0.2,
					color = 'Aqua',
				},
				[4] = {
					base = 1,
					per_lvl = 0,
					color = 'Pink',
				}
			},
		},
	},

	['Guardian'] = {
		id = 'GUARDIAN',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 100, 500, 1000, 100000, 250000, 500000 },
		petType = 'Enchanting Pet',
		stats = {
			{ name = 'Defense', bonus = 0.5 },
			{ name = 'Intelligence', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Lazerbeam',
				[2] = 'Enchanting Wisdom Boost',
				[3] = 'Mana Pool',
				[4] = 'Lucky Seven',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Zaps your enemies for {1} your STAT_INT every <GREEN>3s</GREEN>.',
				[2] = 'Grants <DARK_AQUA>+</DARK_AQUA>{2}STAT_EW.',
				[3] = 'Regenerate {3} extra STAT_MANA, doubled when near or in water.',
				[4] = 'Gain <AQUA>+</AQUA>{4} chance to find <DARK_PURPLE>ultra rare</DARK_PURPLE> books in <LIGHT_PURPLE>Superpairs</LIGHT_PURPLE>.'
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Zaps your enemies for &b{1}x/&b&7your &b Intelligence &7every/&7&a3s.',
				[2] = '&7Grants &3+{2}☯ Enchanting/&3Wisdom&7.',
				[3] = '&7Regenerate &b{3}% &7extra mana,/&7doubled when near or in water.',
				[4] = '&7Gain &b+{4}% &7chance to find/&5ultra rare &7books in/&dSuperpairs&7.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher zap damage per level',
				[2] = '+{2} higher STAT_EW per level',
				[3] = '+{3} higher STAT_MANA regeneration per level',
				[4] = '+{4} chance per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.02,
					color = 'Aqua',
					suffix = 'x',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.06,
					color = 'Aqua',
					suffix = 'x',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.25,
					color = 'Dark_Aqua',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Aqua',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 1.2,
					color = 'Aqua',
					suffix = 'x',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Aqua',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.07,
					color = 'Aqua',
					suffix = '%%',
				},
			},
		},
	},

	['Hedgehog'] = {
		id = 'HEDGEHOG',
		rarities = { 'L' },
		sellPrice = { 100000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Speed', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Spiky Quills',
				[2] = 'Fearsome Farmer',
				[3] = "Hunter's Insight",
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Deal {1} more damage to <DARK_GREEN>ൠ Pests</DARK_GREEN>.',
				[2] = 'Grants <GOLD>+</GOLD>{2} STAT_FMF and <YELLOW>+</YELLOW>{3} STAT_OVERBLOOM on <DARK_GREEN>ൠ Pests</DARK_GREEN>.',
				[3] = 'Grants <GOLD>+</GOLD>{4} STAT_FMF per Pest Bestiary Tier.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Deal &a{1}% &7more damage to &2ൠ Pests&7.',
				[2] = '&7Grants &6+{2} Farming Fortune &7and/&e+{3} Overbloom&7 &7on &2 Pests&7.',
				[3] = '&7Grants &6+{4} Farming Fortune&7 per/&7Pest Bestiary Tier.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '{1} more damage per level.',
				[2] = '+{2} STAT_FMF and +{3} STAT_OVERBLOOM on pests per level.',
				[3] = '+{4} STAT_FMF per Pest Bestiary Tier per level.',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					base = 0,
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 0,
					per_lvl = 1,
					color = 'Gold',
					suffix = '',
				},
				[3] = {
					base = 0,
					per_lvl = 0.35,
					color = 'Yellow',
					suffix = '',
				},
				[4] = {
					base = 0.7,
					per_lvl = 0,
					color = 'Gold',
					suffix = '',
				},
			},
		},
	},

	['Hermit Crab'] = {
		id = 'HERMIT_CRAB',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M'},
		sellPrice = { 10000, 20000, 50000, 200000, 1000000, 2000000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Defense', bonus = 0.2 },
			{ name = 'Fishing Speed', bonus = 0.2 },
			{ name = 'Sea Creature Chance', bonus = 0.02 },
		},
		abilities = {
			name = {
				[1] = 'Comfort Zone',
				[2] = 'Seafloor Scalper',
				[3] = 'Crab Rave',
				[4] = 'Hotspot Hazard',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants +{1} STAT_FS for <GREEN>30s</GREEN> upon catching <GOLD>Treasure</GOLD>.',
				[2] = '<GOLD>Treasure</GOLD> catches are {2} more likely to be <GOLD>GREAT</GOLD> or <PINK>OUTSTANDING</PINK>.',
				[3] = 'Grants +{3} STAT_TRC for each player with a <GREEN>Hermit Crab Pet</GREEN> within <GREEN>30</GREEN> blocks, up to <GREEN>5</GREEN> players.',
				[4] = 'Increases the chance of catching <PINK>Hotspot Sea Creatures</PINK> by {4}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &b+{1} Fishing Speed &7for &a30s/&7upon catching &6Treasure&7.',
				[2] = '&6Treasure &7catches are &a{2}% &7more/&7likely to be &6&lGREAT &7or &d&lOUTSTANDING&7.',
				[3] = '&7Grants &6+{3} Treasure Chance &7for/&7each player with a &aHermit Crab Pet/&7within &a30 &7blocks, up to &a5 &7players.',
				[4] = '&7Increases the chance of catching/&dHotspot Sea Creatures &7by &a{4}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} more STAT_FS per level',
				[2] = '+{2} more likely per level',
				[3] = '+{3} higher STAT_TRC per level',
				[4] = '+{4} higher chance per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Aqua',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.3,
					color = 'Aqua',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.075,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.4,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = '3',
				[1] = {
					per_lvl = 0.4,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.002,
					color = 'Gold',
				},
			},
			mythic = {
				ability_count = '4',
				[1] = {
					per_lvl = 0.4,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.002,
					color = 'Gold',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Horse'] = {
		id = 'HORSE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 50, 500, 2500, 5000, 10000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Intelligence', bonus = 0.5 },
			{ name = 'Speed', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'High Stride',
				[2] = 'High Stride',
				[3] = 'Stampede',
				[4] = 'High Stride',
				[5] = 'Trample',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants permanent <AQUA>Jump Boost II</AQUA>.',
				[2] = 'Grants permanent <AQUA>Jump Boost III</AQUA>.',
				[3] = 'Mob kills grant a stack of <WHITE>+</WHITE>{1} STAT_SPD and <RED>+</RED>{2} STAT_STR for <GREEN>5s</GREEN>.\n<DARK_GRAY>(Max 20 stacks)</DARK_GRAY>',
				[4] = 'Grants permanent <AQUA>Jump Boost IV</AQUA>.',
				[5] = 'After falling <GREEN>20</GREEN> or more blocks, absorb your fall damage and deal {3} of your weapon\'s STAT_DMG for every block fallen to mobs within <GREEN>3</GREEN> blocks.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants permanent &bJump Boost II&7.',
				[2] = '&7Grants permanent &bJump Boost III&7.',
				[3] = '&7Mob kills grant a stack of &f+{1} /&fSpeed &7and &c+{2}  Strength &7for &a5s&7./&8(Max 20 stacks)',
				[4] = '&7Grants permanent &bJump Boost IV&7.',
				[5] = '&7After falling &a20 &7or more blocks,/&7absorb your fall damage and deal/&a{3}% &7of your weapon\'s &c Damage &7for/&7every block fallen to mobs within &a3/&7blocks.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+0.2 STAT_SPD and +0.05 STAT_STR per level',
				[4] = nil,
				[5] = '+0.045% of STAT_DMG per level'
			},
		},
		variables = {
			common = {
				ability_indices = {1},
			},
			uncommon = {
				ability_indices = {2},
			},
			rare = {
				ability_indices = {2, 3},
				[1] = {
					base = 1,
					per_lvl = 0.2,
					color = 'White',
				},
				[2] = {
					base = 1,
					per_lvl = 0.05,
					color = 'Red',
				},
			},
			epic = {
				ability_indices = {4, 3},
				[1] = {
					base = 1,
					per_lvl = 0.2,
					color = 'White',
				},
				[2] = {
					base = 1,
					per_lvl = 0.05,
					color = 'Red',
				},
			},
			legendary = {
				ability_indices = {4, 3, 5},
				[1] = {
					base = 1,
					per_lvl = 0.2,
					color = 'White',
				},
				[2] = {
					base = 1,
					per_lvl = 0.05,
					color = 'Red',
				},
				[3] = {
					base = 0.5,
					per_lvl = 0.045,
					color = 'Green',
					suffix = '%%',
				}
			},
		},
	},

	['Hound'] = {
		id = 'HOUND',
		rarities = { 'E', 'L' },
		sellPrice = { 2000, 100000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.4 },
			{ name = 'Attack Speed', bonus = 0.25 },
			{ name = 'Ferocity', bonus = 0.05 },
			{ name = 'Speed', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Scavenger',
				[2] = 'Finder',
				[3] = 'Pack Slayer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain +{1} coins per monster kill.',
				[2] = 'Increases the chance for monsters to drop their armor by {2}.',
				[3] = 'Gain <GREEN>+</GREEN>{3} Combat XP against <GREEN>Wolves</GREEN>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain +&a{1} &7coins per monster kill.',
				[2] = '&7Increases the chance for monsters/&7to drop their armor by &a{2}%&7.',
				[3] = '&7Gain &b+{3} &7Combat XP against &aWolves&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more COINS',
				[2] = '+{2} higher chance per level',
				[3] = '+{3} more Combat XP per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Gold',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					base = 1,
					per_lvl = 0.005,
					color = 'Green',
					suffix = 'x',
				},
			},
		},
	},

	['Jade Dragon'] = {
		id = 'JADE_DRAGON',
		rarities = { 'L' },
		sellPrice = { 5000 },
		petType = 'Foraging Pet',
		levels = '100-200',
		stats = {
			{ name = 'Strength', base = 25, bonus = 0.25 },
			{ name = 'Magic Find', base = 5, bonus = 0.05 },
			{ name = 'Foraging Fortune', base = 25, bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Forest Power',
				[2] = 'Jade Scale',
				[3] = 'Dragon\'s Pride',
				[4] = 'Apex Predator',
				[5] = 'Symbiosis',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Adds +{1} STAT_STR and +{2} STAT_SPD to all your Axes.',
				[2] = 'Grants +<GOLD>15</GOLD> STAT_FRF and +<DARK_GREEN>4</DARK_GREEN> STAT_SWP for every digit in your <GREEN>Mangrove Collection</GREEN>. <DARK_GRAY>(Max 10M collection)</DARK_GRAY>',
				[3] = 'Grants +<GOLD>1</GOLD> STAT_FRF per <DARK_GREEN>5</DARK_GREEN> STAT_SWP.',
				[4] = 'Increases your total STAT_SWP by <DARK_GREEN>0.1%</DARK_GREEN> for every Maxed out Attribute you unlocked.',
				[5] = 'If you own a level <GREEN>200 Jade Dragon</GREEN>, Grants <GOLD>+4</GOLD> STAT_FRF for every other unique maxed Foraging Pet that you own..',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Adds &c{1} Strength &7and &f{2} Speed/&7to all your Axes.',
				[2] = '&7Grants &615 Foraging Fortune &7and/&24 Sweep &7for every digit in your/&aMangrove Collection&7./&8(Max 10M collection)' ,
				[3] = '&7Grants &61 Foraging Fortune &7per &25/&2Sweep&7.',
				[4] = '&7Increases your total &2 Sweep &7by/&20.1% &7for every Maxed out Attribute/&7you unlocked.',
				[5] = '&7If you own a level &a200 Jade Dragon&7,/&7Grants &6+4 Foraging Fortune for/&7every other unique maxed Foraging/&7Pet that you own..',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} strength per level and +{2} speed per level',
				[2] = nil,
				[3] = nil,
				[4] = nil,
				[5] = 'Only active on level 200',
			},
		},
		variables = {
			legendary = {
				ability_count = 5,
				[1] = {
					base = 75,
					per_lvl = 0.25,
					color = 'Red',
				},
				[2] = {
					base = 37.5,
					per_lvl = 0.125,
					color = 'White',
				},
			},
		},
	},

	['Jellyfish'] = {
		id = 'JELLYFISH',
		rarities = { 'E', 'L' },
		sellPrice = { 2000, 5000 },
		petType = 'Alchemy Pet',
		stats = {
			{ name = 'Health', bonus = 2 },
			{ name = 'Health Regen', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Radiant Scyphozoa',
				[2] = 'Stored Energy',
				[3] = 'Powerful Potions',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'While in dungeons, reduces the mana cost of Power Orbs by {1}.',
				[2] = 'While in dungeons, for every <RED>2,000 HP</RED> you heal teammates the cooldown of <GREEN>Wish</GREEN> is reduced by {2}, up to <GREEN>30s</GREEN>.',
				[3] = 'While in dungeons, increase the effectiveness of Dungeon Potions by {3}',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7While in dungeons, reduces the/&7mana cost of/&7Power Orbs by &a{1}%&7.',
				[2] = '&7While in dungeons, for every/&c2,000 HP &7you heal teammates/&7the cooldown of &aWish &7is/&7reduced by &a{2}s&7, up to/&a30s&7.',
				[3] = '&7While in dungeons, increase/&7the effectiveness of Dungeon/&7Potions by &a{3}%',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '{1} decreased mana cost for Power Orbs per level',
				[2] = '<GREEN>Wish</GREEN> reduced by {2} per level',
				[3] = '+{3} more effectiveness per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Green',
					suffix = 's',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Green',
					suffix = 's',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Jerry'] = {
		id = 'JERRY',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 50, 500, 2500, 5000, 10000, 25000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Intelligence', bonus = -1 },
		},
		abilities = {
			name = {
				[1] = 'Jerry',
				[2] = 'Jerry',
				[3] = 'Jerry',
				[4] = 'Jerry',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <GREEN>50%</GREEN> chance to deal your regular damage.',
				[2] = 'Gain <GREEN>100%</GREEN> chance to receive a normal amount of drops from mobs.',
				[3] = 'Actually adds {1} STAT_DMG to the [[Aspect of the Jerry]].',
				[4] = 'Tiny chance to find Jerry Candies when killing mobs.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a50% &7chance to deal/&7your regular damage.',
				[2] = '&7Gain &a100% &7chance to/&7receive a normal amount of drops/&7from mobs.',
				[3] = '&7Actually adds &c{1} damage &7to/&7the Aspect of the Jerry.',
				[4] = '&7Tiny chance to find Jerry/&7Candies when killing mobs.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+{1} more damage added per level',
				[4] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 2,
			},
			uncommon = {
				ability_count = 2,
			},
			rare = {
				ability_count = 2,
			},
			epic = {
				ability_count = 2,
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.1,
					color = 'Red',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.5,
					color = 'Red',
				},
			},
		},
	},

	['Kuudra'] = {
		id = 'KUUDRA',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 100, 500, 1000, 2000, 5000 },
		petType = 'Combat Pet',
		isPassive = true,
		stats = {
			{ name = 'Strength', bonus = 0.4 },
			{ name = 'Health', bonus = 4 },
		},
		abilities = {
			name = {
				[1] = 'Wither Bait',
				[2] = 'Trophy Bait',
				[3] = 'Crimson',
				[4] = 'Kuudra Fortune',
				[5] = 'Kuudra Specialist',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases the odds of finding a {{MobSprite|Vanquisher}} by {1}.',
				[2] = 'Grants <GOLD>+</GOLD>{2} STAT_TPC while on the <RED>Crimson Isle</RED>.',
				[3] = 'Grants {3} extra [[Crimson Essence]].',
				[4] = 'Gain <GOLD>+</GOLD>{4} STAT_MNF while on the {{Zone|Crimson Isle}}.',
				[5] = 'Increases all damage to Kuudra and his minions by <RED>20%</RED>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases the odds of finding/&7a vanquisher by &a{1}%&7.',
				[2] = '&7Grants &6+{2} Trophy Chance&7 while/&7on the &cCrimson Isle&f.',
				[3] = '&7Grants &a{3}% &7extra Crimson/&7Essence.',
				[4] = '&7Gain &6+{4} Mining Fortune/&7while on the Crimson Isle.',
				[5] = '&7Increases all damage to Kuudra and/&7his minions by &c20%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} odds of finding a [[Vanquisher]] per level',
				[2] = '+{2} more STAT_TPC while on the [[Crimson Isle]] per level',
				[3] = '+{3} extra [[Crimson Essence]] per level',
				[4] = '+{4} more STAT_MNF while on the [[Crimson Isle]] per level',
				[5] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Gold',
				},
			},
			rare = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 1,
					color = 'Gold',
				},
			},
			legendary = {
				ability_count = '5',
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 1,
					color = 'Gold',
				},
			},
		},
	},

	['Lion'] = {
		id = 'LION',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000 },
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Ferocity', bonus = 0.05 },
			{ name = 'Speed', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Primal Force',
				[2] = 'First Pounce',
				[3] = 'King of the Jungle',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Adds +{1} STAT_DMG and +{2} STAT_STR to your weapons.',
				[2] = 'First strike, Triple-strike, and {{Ench|Combo}} are {3} more effective.',
				[3] = 'Deal +{4} STAT_DMG against mobs that have attacked you.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Adds &c+{1} &c Damage &7and/&7&c+{2} &c Strength &7to your/&7weapons.',
				[2] = '&7First Strike&7,/&7Triple-Strike&7, and &d&lCombo/&r&7are &a{3}% &7more effective.',
				[3] = '&7Deal &c+{4}% &c Damage/&c&7against mobs that have/&7attacked you.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_DMG per level; +{2} STAT_STR per level',
				[2] = '+{3} more damage per level',
				[3] = '+{4} more damage per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.03,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.03,
					color = 'Red',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.05,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.05,
					color = 'Red',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.15,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Red',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Red',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 1.5,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Magma Cube'] = {
		id = 'MAGMA_CUBE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 100, 500, 2000, 10000, 1000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 0.5 },
			{ name = 'Defense', bonus = 0.33 },
			{ name = 'Strength', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Slimy Minions',
				[2] = 'Salt Blade',
				[3] = 'Hot Ember',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Slime and Magma Cube minions work {1} faster while on your island.',
				[2] = 'Deal {2} more damage to slimes.',
				[3] = 'Buffs the stats of [[Rekindled Ember Armor]] by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Slime and Magma Cube minions work/&a{1}% &a&7faster while on your island',  -- Full stop missing: sic
				[2] = '&7Deal &a{2}% &7more damage to slimes',  -- Full stop missing: sic
				[3] = '&7Buffs the stats of &5Rekindled Ember/&5Armor &7by &a{3}%.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher minion speed bonus per level',
				[2] = '+{2} more damage per level',
				[3] = '+{3} higher buff per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Mammoth'] = {
		id = 'MAMMOTH',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Defense', bonus = 0.5 },
			{ name = 'Cold Resistance', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Wooly Coat',
				[2] = 'Tusk Luck',
				[3] = 'Corpse Crusher',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain a {1} chance for mobs to not inflict STAT_COLD when damaging you in the [[Glacite Mineshafts]].',
				[2] = 'Gain {2} Magic Find for every 100 STAT_MNF, doubled in the [[Glacite Tunnels]] and [[Glacite Mineshafts]].',
				[3] = 'Gain <ORANGE>+</ORANGE>{3}STAT_MNF for each [[Frozen Corpse]] looted in your current Glacite Mineshaft.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain a &a{1}% &7chance for mobs to not/&7inflict &b Cold &7when damaging you in/&7the &bGlacite Mineshafts&7.',
				[2] = '&7Gain &b+{2} Magic Find &7for every/&7100 &6 Mining Fortune&7, doubled in the/&bGlacite Tunnels &7and &bGlacite/&bMineshafts&7.',
				[3] = '&7Gain &6+{3} Mining Fortune &7for each/&bFrozen Corpse &7looted in your/&7current &bGlacite Mineshaft&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} higher chance per level',
				[2] = '+{2} more STAT_MF per level',
				[3] = '+{3} more STAT_MNF per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.005,
					color = 'Aqua',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Orange',
				},
			},
		},
	},

	['Megalodon'] = {
		id = 'MEGALODON',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 2500000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Ferocity', base = 5, bonus = 0.05 },
			{ name = 'Magic Find', bonus = 0.1 },
			{ name = 'Fishing Speed', base = 10, bonus = 0.3 },
			{ name = 'Sea Creature Chance', base = 5, bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Blood Scent',
				[2] = 'Enhanced Scales',
				[3] = 'Feeding Frenzy',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Deal up to <RED>+</RED>{1} STAT_DMG based on the enemy\'s missing health.',
				[2] = 'Doubles the pet\'s base stats during the <AQUA>Fishing Festival</AQUA>.',
				[3] = 'Grants a {2} chance to catch <AQUA>Sharks</AQUA> during the <AQUA>Fishing Festival</AQUA>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Deal up to &c+{1}% &c Damage &7based on/&7the enemy\'s missing health.',
				[2] = '&7Doubles the pet\'s base stats during/&7the &bFishing Festival&7.',
				[3] = '&7Grants a &a{2}% &7chance to catch/&bSharks &7during the &bFishing Festival&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more damage dealt per level',
				[3] = '+{2} higher Shark chance per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					base = 50,
					per_lvl = 1,
					color = 'Red',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 50,
					per_lvl = 1,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					base = 10,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Mithril Golem'] = {
		id = 'MITHRIL_GOLEM',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 250, 5000, 10000, 25000, 50000, 100000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'True Defense', bonus = 0.5 },
			{ name = 'Mining Fortune', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Mithril Affinity',
				[2] = 'Subterranean Battler',
				[3] = 'The Smell Of Powder',
				[4] = 'Refined Senses',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <GOLD>+{1}</GOLD> STAT_MS when mining <DARKGREEN>[[Mithril]]</DARKGREEN>.',
				[2] = 'Increases all <RED>Combat Stats</RED> by <GREEN>+{2}</GREEN> on <AQUA>Mining Islands</AQUA>.',
				[3] = 'Grants <DARKGREEN>+{3}</DARKGREEN> {{Mithril Powder}} from all sources.',
				[4] = 'Grants <AQUA>+{4}</AQUA> STAT_MF while on <AQUA>[[Mining Islands]]</AQUA>.'
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &6+{1}&6 Mining Speed &7when/&7mining &2Mithril&7.',
				[2] = '&7Increases all &cCombat Stats &7by &a+{2}%/&7on &bMining Islands&7.',
				[3] = '&7Grants &2+{3}% ᠅ Mithril Powder &7from/&7all sources.',
				[4] = '&7Grants &b+{4}%  Magic Find&7 while on/&bMining Islands&7.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_MS while mining <DARKGREEN>[[Mithril]]</DARKGREEN>',
				[2] = '+{2} more combat stats on mining islands',
				[3] = '+{3} extra {{Mithril Powder}}',
				[4] = '+{4} more STAT_MF when on a Mining Island'
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 1,
					color = 'Orange',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 1.5,
					color = 'Orange',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 1.5,
					color = 'Orange',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 2,
					color = 'Orange',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 2,
					color = 'Orange',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'DarkGreen',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 2,
					color = 'Orange',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'DarkGreen',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					color = 'Aqua',
					suffix = '%%',
				},
			},
		},
	},

	['Mole'] = {
		id = 'MOLE',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Magic Find', bonus = 0.05 },
			{ name = 'Mining Speed', bonus = 1.5 },
		},
		abilities = {
			name = {
				[1] = 'Archaeologist',
				[2] = 'Magnetic Nose',
				[3] = 'Nucleic Explorer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increase your chance of finding Scavenged Items in the Mines of Divan by {1}.',
				[2] = 'Automatons drop their parts {2} more frequently.',
				[3] = 'Gain a {3} chance to receive an extra drop when completing the Crystal Nucleus.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increase your chance of finding/&cScavenged Items &7in the &2Mines of/&2Divan &7by {1}&7.',
				[2] = '&9Automatons &7drop their parts &a50%/&7more frequently.',
				[3] = '&7Gain a {3} &7chance to receive an/&7extra drop when completing the/&dCrystal Nucleus&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} higher chance per level',
				[2] = '+{2} higher drop rate per level',
				[3] = '+{3} higher chance per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Monkey'] = {
		id = 'MONKEY',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000 },
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Intelligence', bonus = 0.5 },
			{ name = 'Speed', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Treeborn',
				[2] = 'Vine Swing',
				[3] = 'Evolved Axes',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants +{1} STAT_FRF, which increases your chances at double logs.',
				[2] = 'Gain +{2} STAT_SPD while in [[The Park]].',
				[3] = 'Grants +{3} STAT_SWP while in [[The Park]].',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &a+{1} &6 Foraging/&6Fortune&7, which increases your/&7chance at double logs.',
				[2] = '&7Gain +&a{2} &f Speed &7while/&7in The Park.',
				[3] = '&7Grants &2{3} Sweep &7while in &aThe Park',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance per level',
				[2] = '+{2} more STAT_SPD per level',
				[3] = '+{3} more STAT_SWP per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.75,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.6,
					color = 'Green',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.6,
					color = 'Green',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
				},
			},
		},
	},

	['Montezuma'] = {
		id = 'MONTEZUMA', -- placeholder, couldn't find it shown in game
		rarities = { 'R', 'E' },
		rift = true,
		level = 100,
		petType = 'Fractured Soul Pet',
		stats = {
			{ name = 'Rift Time', base = 25 },
		},
		abilities = {
			name = {
				[1] = 'Nine Lives',
				[2] = 'Trickery',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <GREEN>+</GREEN>{1} STAT_RT per soul piece.',
				[2] = 'Gain <AQUA>+</AQUA>{2} STAT_MR per soul piece found.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a+{1} Rift Time &7per/&7soul piece.',
				[2] = '&7Gain &b+{2} Mana Regen &7per/&7soul piece found.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
			},
		},
		variables = {
			rare = {
				ability_count = 1,
				[1] = {
					base = 15,
					per_lvl = 0,
					color = 'Green',
				},
			},
			epic = {
				stats = {
					{ name = 'Rift Time', base = 25 },
					{ name = 'Mana Regen' },
				},
				ability_count = 2,
				[1] = {
					base = 15,
					per_lvl = 0,
					color = 'Green',
				},
				[2] = {
					base = 2,
					per_lvl = 0,
					color = 'Aqua',
				},
			},
		},
	},

	['Mooshroom Cow'] = {
		id = 'MOOSHROOM_COW',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 1000, 25000, 50000, 100000, 250000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Farming Fortune', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Mushroom Eater',
				[2] = 'Farming Strength',
				[3] = 'Bovine Blessing',

			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'You have a +{1} chance to drop a Mushroom when farming crops.',
				[2] = 'Grants <GOLD>+0.7</GOLD> STAT_FMF per every {2} STAT_STR you have.',
				[3] = 'You have a {3} chance to find Tasty Cheese or Dung when farming crops.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7You have a &a+{1} &7chance to drop a/&7Mushroom when farming crops.',
				[2] = '&7Grants &6+0.7 Farming Fortune for/&7every &c{2}  Strength &7you have.',
				[3] = '&7You have a &a+{3}% &7chance to find/&aTasty Cheese &7or &aDung &7when farming/&7crops.',

			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher drop chance per level',
				[2] = '{2} strength needed for each {{Stat|fmf|+0.7}} per level',
				[3] = '+{3} higher chance to find {{ID|Tasty Cheese}} or {{ID|Dung}} when farming crops',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 40,
					per_lvl = -0.2,
					color = 'Red',
				},

			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 40,
					per_lvl = -0.2,
					color = 'Red',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 40,
					per_lvl = -0.2,
					color = 'Red',
				},
				[3] = {
					per_lvl = 0.0002,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Mosquito'] = {
		id = 'MOSQUITO',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 250000, 500000, 1000000, 2500000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Speed', bonus = 0.2 },
			{ name = 'Bonus Pest Chance', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'Smooth Jazz',
				[2] = 'Buzzin\' Barterer',
				[3] = 'Bloodsucker\'s Betrayal',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Pest Vinyls are +{1} more effective.',
				[2] = 'Gain +{2} STAT_SCF for every unique visitor you\'ve served in <GREEN>The Garden</GREEN>.<br/><DARK_GRAY>Your Bonus: # Sugar Cane Fortune<br/>Capped at 175 Fortune</DARK_GRAY>',
				[3] = 'When collected, <DARK_GREEN>Pest Traps</DARK_GREEN> will catch the next pest {3} faster.',
			},
			tooltip = {
				[1] = '&7Pest Vinyls are &a+{1}% &7more effective.',
				[2] = '&7Gain &6+{2} Sugar Cane Fortune &7for/&7every unique visitor you\'ve served/&7in &aThe Garden&7./&8Your Bonus: # Sugar Cane Fortune/&8Capped at 175 Fortune',
				[3] = '&7When collected, &2Pest Traps &7will catch/&7the next pest &a{3}% &7faster.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more effective per level',
				[2] = '+{2} more STAT_SCF per unique visitor per level',
				[3] = '+{3} faster Pest Traps per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Gold',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.02,
					color = 'Gold',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.02,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Ocelot'] = {
		id = 'OCELOT',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 250, 5000, 10000, 25000, 50000 },
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Ferocity', bonus = 0.1 },
			{ name = 'Speed', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'Foraging Wisdom Boost',
				[2] = 'Tree Hugger',
				[3] = 'Tree Essence',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants <DARK_AQUA>+</DARK_AQUA>{1}STAT_FRW.',
				[2] = 'Foraging minions work {2} faster while on your island.',
				[3] = 'Gain a {3} chance to get exp from breaking a log.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants &3+{1}☯ Foraging/&3Wisdom&7.',
				[2] = '&7Foraging minions work &a{2}%/&a&7faster while on your island.',
				[3] = '&7Gain a &a{3}% &7chance to get/&7exp from breaking a log.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_FRW per level',
				[2] = '+{2} higher speed boost per level',
				[3] = '+{3} higher chance per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Dark_Aqua',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.25,
					color = 'Dark_Aqua',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.25,
					color = 'Dark_Aqua',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Orchid Mantis'] = {
		id = 'ORCHID_MANTIS',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 250000, 500000, 1000000, 2500000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Speed', bonus = 0.3 },
			{ name = 'Overbloom', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Intelligent Specimen',
				[2] = 'Swift Sickles',
				[3] = 'Orchid Nectar',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Earn +{1} more Farming Tool Exp.',
				[2] = 'Convert every 3 STAT_SPD you have above 100 into +{2} STAT_FMF.',
				[3] = 'You have a {3} chance to find Jelly or Plant Matter when farming crops.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Earn &a+{1}% &7more Farming Tool Exp.',
				[2] = '&7Convert every &f3 &f Speed &7you have/&7above &f100 &7into &6+{2} Farming/&6Fortune.',
				[3] = '&7You have a &a+{3}% &7chance to find/&aJelly &7or &aPlant Matter &7when farming/&7crops.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} more Farming Tool Exp',
				[2] = '+{2} more STAT_FMF',
				[3] = '+{3} higher chance to find {{ID|Jelly}} or {{ID|Plant Matter}} when farming crops',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.005,
					color = 'Gold',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Gold',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.01,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.0002,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Owl'] = {
		id = 'OWL',
		rarities = { 'L' },
		sellPrice = { 200000 },
		petType = 'Taming Pet',
		isPassive = true,
		stats = {},
		abilities = {
			name = {
				[1] = 'Training Refunds',
				[2] = 'Efficient Trainer',
				[3] = 'Fast Learner',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'The more coins to spend on Fann\'s Sessions, the less coins they will cost. <DARK_GRAY>(max 5% off).</DARK_GRAY>',
				[2] = 'Makes training sessions at Fann more efficient when added into a session.\n\nIncreased EXP: <AQUA>+{1} EXP</AQUA>',
				[3] = 'Passively grants <DARK_AQUA>+</DARK_AQUA>{2}STAT_TW.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7The more coins to spend on/&7Fann\'s Sessions, the less coins/&7they will cost. &8(max 5% off).',
				[2] = '&7Makes training sessions at/&7Fann more efficient when added/&7into a session.//&7Increased EXP: &b+{1}% EXP',
				[3] = '&7Passively grants &3+{2}☯ Taming/&3Wisdom',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = '+{1} increased pet training EXP per level',
				[3] = '+{2} more STAT_TW per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					base = 0.1,
					per_lvl = 0.099,
					color = 'Aqua',
					suffix = '%%',
				},
				[2] = {
					base = 0.05,
					per_lvl = 0.045,
					color = 'Dark_Aqua',
				}
			},
		},
	},

	['Parrot'] = {
		id = 'PARROT',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 5000000 },
		petType = 'Alchemy Pet',
		stats = {
			{ name = 'Crit Damage', bonus = 0.1 },
			{ name = 'Intelligence', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Flamboyant',
				[2] = 'Repeat',
				[3] = 'Bird Discourse',
				[4] = 'Parrot Feather Infusion',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Adds {1} level(s) to [[Accessories|intimidation accessories]].',
				[2] = 'Boosts potions duration by {2}.',
				[3] = 'Gives +{3} STAT_STR to players within 20 Blocks <DARK_GRAY>(doesn\'t stack)</DARK_GRAY>.',
				[4] = 'When summoned or in your pets menu, boost the duration of consumed [[God Potion|God Potions]] by +{4}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Adds &a{1} &7levels to/&7intimidation accessories.',
				[2] = '&7Boosts potions duration by/&7&a{2}%',
				[3] = '&7Gives &c+{3} Strength &7to/&7players within &a20 &7blocks/&8Doesn\'t stack.',
				[4] = '&7When summoned or in your pets/&7menu, boost the duration of/&7consumed &cGod Potions &7by/&7&a{4}%',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+<GREEN>1</GREEN> level per ≈{5} level(s)',
				[2] = '+{2} higher duration boost per level',
				[3] = '+{3} more STAT_STR per level',
				[4] = '+{4} higher duaration boost per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					eval = 'Parrot',
					base = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.35,
					base = 5,
					color = 'Green',
					suffix = '%%',
				},
				[5] = {
					per_lvl = 7, -- only used in bonus_desc
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 4,
				[1] = {
					eval = 'Parrot',
					base = 1,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.35,
					base = 5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.25,
					base = 5,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[5] = {
					per_lvl = 5, -- only used in bonus_desc
					color = 'Green'
				},
			},
		},
	},

	['Penguin'] = {
		id = 'PENGUIN',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Sea Creature Chance', bonus = 0.1 },
			{ name = 'Cold Resistance', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Thick Blubber',
				[2] = 'Chilly Reception',
				[3] = 'Subzero Hero',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Each time you catch a <DARK_AQUA>Sea Creature</DARK_AQUA>, reduce your STAT_COLD by {1}.',
				[2] = 'Grants <AQUA>+{2}</AQUA>STAT_CR for each player within <GREEN>30</GREEN> blocks, up to <GREEN>10</GREEN> players.',
				[3] = 'Gain <AQUA>+</AQUA>{3}STAT_FS while in the <AQUA>Glacite Tunnels</AQUA>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Each time you catch a Sea Creature,/&7reduce your &b Cold &7by &a{1}&7.',
				[2] = '&7Grants &b+{2} Cold Resistance &7for/&7each player within &a30 &7blocks, up to/&a10 &7players.',
				[3] = '&7Gain &b+{3} Fishing Speed&7 while in the/&bGlacite Tunnels&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} STAT_COLD reduced per level',
				[2] = '+{2} STAT_CR per level',
				[3] = '+{3} STAT_FS per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.05,
					base = 1,
					color = 'Green',
					round_down = true,
				},
				[2] = {
					per_lvl = 0.01,
					base = 0,
					color = 'Aqua',
				},
				[3] = {
					per_lvl = 0.75,
					color = 'Aqua',
				},
			},
		},
	},

	['Phoenix'] = {
		id = 'PHOENIX',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 5000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', base = 10, bonus = 0.5 },
			{ name = 'Intelligence', base = 50, bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Rekindle',
				[2] = 'Fourth Flare',
				[3] = 'Magic Bird',
				[4] = 'Eternal Coins',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Before death, become immune and gain {1} STAT_STR for {2} seconds (1 minute cooldown)',
				[2] = 'On 4th melee strike, ignite mobs, dealing {3} your STAT_CD each second for {4} seconds.',
				[3] = 'You may always fly on your [[Private Island]].',
				[4] = 'Don\'t lose COINS from death.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Before death, become &eimmune/&e&7and gain &c{1} &c Strength/&c&7for &a{2} &7seconds./&81 minute cooldown',
				[2] = '&7On 4th melee strike, &6ignite/&6&7mobs, dealing &c{3}x &7your &9/&9Crit Damage &7each second for/&7&a{4} &7seconds.',
				[3] = '&7You may always fly on your/&7private island.',
				[4] = '&7Don\'t lose coins from death.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_STR per level; duration increases by {2} second',
				[2] = '+{3} more damage bonus per level; duration increases by {4} second',
				[3] = nil,
				[4] = nil,
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					base = 10,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.02,
					base = 2,
					color = 'Green',
					round_down = true,
				},
				[3] = {
					per_lvl = 0.12,
					base = 1,
					color = 'Red',
					suffix = '×',
				},
				[4] = {
					per_lvl = 0.02,
					base = 2,
					color = 'Green',
					round_down = true,
				},
			},
			legendary = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.15,
					base = 15,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.02,
					base = 2,
					color = 'Green',
					round_down = true,
				},
				[3] = {
					per_lvl = 0.14,
					base = 1,
					color = 'Red',
					suffix = '×',
				},
				[4] = {
					per_lvl = 0.03,
					base = 2,
					color = 'Green',
					round_down = true,
				},
			},
		},
	},

	['Pig'] = {
		id = 'PIG',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 50, 500, 2500, 5000, 10000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Speed', bonus = 0.15 },
			{ name = 'Potato Fortune', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Hamfisted',
				[2] = 'Shining Stampede',
				[3] = 'Pig Parade',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increase {{c}} gain from {{gold|Shiny Pigs}} by {1}.',
				[2] = 'Grants +{2} {{gold|Potato Fortune}} per {{gold|Shiny Pig}} {{DarkAqua|Bestiary}} tier.',
				[3] = 'Increases the base stats of this pet by {3} during the {{Pink|Year of the Pig}}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases &6Coin &7gain from &6Shiny Pigs/&7by &a{1}%&7.',
				[2] = '&7Grants &6+{2} Potato Fortune &7per/&6Shiny Pig &3Bestiary &7tier.',
				[3] = '&7Increases the base stats of this pet/&7by &a{3}% &7during the &dYear of the Pig&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more Coins from Shiny Pigs per level.',
				[2] = '+{2} more Potato Farming Fortune per Shiny Pig Bestiary tier per pet level',
				[3] = '+{3} more increase to pet\'s base stats during Year of the Pig per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.04,
					color = 'Gold',
					suffix = '',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.05,
					color = 'Gold',
					suffix = '',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.05,
					color = 'Gold',
					suffix = '',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Pigman'] = {
		id = 'PIGMAN',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 1000, 25000, 50000, 100000, 250000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Defense', bonus = 0.5 },
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Ferocity', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Bacon Farmer',
				[2] = 'Pork Master',
				[3] = 'Giant Slayer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '[[Pig Minion|Pig minions]] work {1} faster while on your island.',
				[2] = 'Buffs the [[Pigman Sword]] by {2} STAT_DMG and {3} STAT_STR.',
				[3] = 'Deal <RED>+50%</RED> damage to monsters Level <GREEN>50+</GREEN> and <RED>+75%</RED> damage to monsters Level <GREEN>100+</GREEN>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Pig minions work &a{1}%/&a&7faster while on your island.',
				[2] = '&7Buffs the Pigman sword by &a{2}/&a&c Damage &7and &a{3} &c/&cStrength.',
				[3] = '&7Deal &c+50% &7damage to monsters Level/&a50+ &7and &c+75% damage to monsters/&7Level &a100+&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher minion speed boost per level',
				[2] = '+{2} more STAT_DMG per level; +{3} STAT_STR per level',
				[3] = 'None',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.15,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
				},
			},
		},
	},

	['Precursor Drone'] = {
		id = 'PRECURSOR_DRONE',
		rarities = { 'C' },
		sellPrice = { 100 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Sea Creature Chance', bonus = 0.1 },
			{ name = 'Mining Fortune', bonus = 0.3 },
			{ name = 'Foraging Fortune', bonus = 0.3 },
		},
		abilities = {
			name = {
				[1] = 'Contraband',
				[2] = 'Grungle',
				[3] = 'Mining Off Camera',
			},
			desc = {
				[1] = 'Catching a <DARK_AQUA>Sea Creature</DARK_AQUA> has a <GREEN>10%</GREEN> chance to also give you <GOLD>Treasure</GOLD>.',
				[2] = 'You can now ONLY throw your Foraging Axe, but it has <RED>no throwing penalty</RED> anymore.',
				[3] = 'While mining, each collection progress grants a <GREEN>0.005%</GREEN> chance to drop a random enchanted mining item.',
			},
			tooltip = {
				[1] = '&7Catching a &3Sea Creature &7has a &a10%/&7chance to also give you &6Treasure&7.',
				[2] = '&7You can now ONLY throw your/&7Foraging Axe, but it has &cno throwing/&cpenalty&7 anymore.',
				[3] = '&7While mining, each collection/&7progress grants a &a0.005% &7chance to/&7drop a random enchanted mining item.',
			},
			bonus_desc = {
				[1] = nil,
				[2] = nil,
				[3] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 3,
			},
		},
	},

	['Rabbit'] = {
		id = 'RABBIT',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 250, 5000, 10000, 25000, 50000, 100000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Speed', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Happy Feet',
				[2] = 'Farming Wisdom Boost',
				[3] = 'Efficient Farming',
				[4] = 'Chocolate Injections',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Jump potions also give +{1} STAT_SPD',
				[2] = 'Grants <DARK_AQUA>+</DARK_AQUA>{2}STAT_FMW.',
				[3] = '[[Minions|Farming minions]] work {3} faster while on your island.',
				[4] = 'Increases <YELLOW>[[Chocolate Factory]]</YELLOW> production by {4}. Duplicate <GREEN>Chocolate Rabbits</GREEN> that you find grant <GOLD>+</GOLD>{5} <GOLD>[[Chocolate]]</GOLD>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Jump potions also give &a+{1}/&a&7speed.',
				[2] = '&7Gives &3+{2}☯ Farming/&3Wisdom&7.',
				[3] = '&7Farming minions work &a{3}%/&a&7faster while on your island.',
				[4] = '&7Increases &6Chocolate Factory/&7production by &a+{4}x&7. Duplicate/&aChocolate Rabbits&7 that you find/&7grant &6+{5}% Chocolate.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_SPD per level',
				[2] = '+{2} STAT_FMW per level',
				[3] = '+{3} higher speed boost',
				[4] = '+{4} production multiplier and +{5} more Chocolate per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.25,
					color = 'Dark_Aqua',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.0004,
					base = 0.01,
					color = 'Green',
					suffix = 'x',
				},
				[5] = {
					per_lvl = 0.32,
					base = 1.3,
					color = 'Gold',
					suffix = '%%',
				},
			},
		},
	},

	['Rat'] = {
		id = 'RAT',
		rarities = { 'L', 'M' },
		sellPrice = { 5000, 10000 },
		petType = 'Combat Morph',
		stats = {
			{ name = 'Health', bonus = 1.25 },
			{ name = 'Strength', bonus = 0.6 },
			{ name = 'Crit Damage', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Morph',
				[2] = 'CHEESE!',
				[3] = 'Rat\'s Blessing',
				[4] = 'Extreme Speed',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Right-click your summoned pet to morph into it!',
				[2] = "As a Rat, you smell '''{{Yellow|CHEESE}}''' nearby! Yummy!",
				[3] = 'Has a chance to grant a random player +{1} STAT_MF for {2} seconds after finding a yummy piece of Cheese! If the player gets a drop during this buff, you have a {{Green|20%}} chance to get it too.',
				[4] = 'The Rat is TWO times faster.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Right-click your summoned pet/&7to morph into it!',
				[2] = '&7As a Rat, you smell/&7&e&lCHEESE&r&7 nearby! Yummy!',
				[3] = '&7Has a chance to grant a random/&7player &b+{1} Magic Find&7 for/&7&a{2}&7 seconds after finding a/&7yummy piece of Cheese! If the/&7player gets a drop during this/&7buff, you have a &a20% &7chance/&7to get it too.',
				[4] = '&7The Rat is TWO times faster.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+{1} more STAT_MF and +{2} seconds per level',
				[4] = nil,
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {  -- Magic Find
					per_lvl = 0.05,
					base = 2,
					color = 'Green',
				},
				[2] = {  -- Seconds
					per_lvl = 0.4,
					base = 20,
					color = 'Green',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {  -- Magic Find
					per_lvl = 0.05,
					base = 2,
					color = 'Green',
				},
				[2] = {  -- Seconds
					per_lvl = 0.4,
					base = 20,
					color = 'Green',
				},
			},
		},
	},

	['Reindeer'] = {
		id = 'REINDEER',
		rarities = { 'L' },
		sellPrice = { 5000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Fishing Speed', bonus = 0.25 },
			{ name = 'Sea Creature Chance', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Winter Spirit',
				[2] = 'Infused',
				[3] = 'Snow Power',
				[4] = 'Icy Wind',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <PINK>double</PINK> pet <GREEN>EXP</GREEN>.',
				[2] = 'Gives <AQUA>+</AQUA>{1} STAT_FS and <GOLD>+5</GOLD>STAT_TRC while on <RED>Jerry\'s Workshop</RED>.',
				[3] = 'Grants <GREEN>+{2}</GREEN> bonus gift chance during the <RED>Gift Attack</RED> event.',
				[4] = 'Grants <GREEN>+{3}</GREEN> chance of getting double <AQUA>Ice Essence</AQUA>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &ddouble &7pet &aEXP&7.',
				[2] = '&7Gives &b+{1}&b Fishing Speed &7and &6+5/&6Treasure Chance &7while on &cJerry\'s/&cWorkshop&7.',
				[3] = '&7Grants &a+{2}% &7bonus gift/&7chance during the &cGift Attack/&c&7event.',
				[4] = '&7Grants &a+{3}% &7chance of/&7getting double &bIce Essence&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = '+{1} more STAT_FS per level',
				[3] = '+{2} bonus gift chance per level',
				[4] = '+{3} chance of getting double <AQUA>Ice Essence</AQUA> per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.75,
					color = 'Aqua',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Rift Ferret'] = {
		id = 'RIFT_FERRET',
		rarities = { 'E', 'L' },
		sellPrice = { 50000, 50000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Speed', bonus = 0.5 },
			{ name = 'Intelligence', bonus = -0.02 },
		},
		abilities = {
			name = {
				[1] = 'Orbs are Fun',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <GREEN>+</GREEN>{1} experience from <AQUA>XP Orbs</AQUA>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a+{1}% &7experience from/&bXP Orbs&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
			},
		},
		variables = {
			epic = {
				ability_count = 1,
				[1] = {
					base = 10,
					per_lvl = 0,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 1,
				[1] = {
					base = 10,
					per_lvl = 0,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Rock'] = {
		id = 'ROCK',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 10000, 50000, 500000, 2500000, 10000000 },
		petType = 'Mining Mount',
		stats = {
			{ name = 'Defense', bonus = 2 },
			{ name = 'True Defense', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Rideable',
				[2] = 'Sailing Stone',
				[3] = 'Fortify',
				[4] = 'Steady Ground',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Right-click on your summoned pet to ride it!',
				[2] = 'Sneak to move your rock to your location (15s cooldown)',
				[3] = 'While sitting on your rock, gain +{1} STAT_DEF',
				[4] = 'While sitting on your rock, gain +{2} STAT_DMG',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Right-click your summoned pet/&7to ride it!',
				[2] = '&7Sneak to move your rock to/&7your location (15s cooldown).',
				[3] = '&7While sitting on your rock,/&7gain +&a{1}% &7defense.',
				[4] = '&7While sitting on your rock,/&7gain &c+{2}x &7damage.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+{1} more STAT_DEF per level',
				[4] = '+{2} more STAT_DMG per level',
			},
		},
		variables = {
			common = {
				ability_count = 2,
			},
			uncommon = {
				ability_count = 2,
			},
			rare = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Red',
				},
			},
		},
	},

	['Rose Dragon'] = {
		id = 'ROSE_DRAGON',
		rarities = { 'L' },
		sellPrice = { 5000000 },
		petType = 'Farming Pet',
		levels = '100-200',
		stats = {
			{ name = 'Speed', base = 50, bonus = 0.5 },
			{ name = 'Farming Fortune', base = 20, bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Garden Power',
				[2] = 'Rosy Scales',
				[3] = 'Dragon\'s Gluttony',
				[4] = 'Spiritual Perfection',
				[5] = 'Symbiosis',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants +{1} STAT_FMF per <GREEN>Farming</GREEN> level.',
				[2] = 'Grants +{2} STAT_FMF and +{3} STAT_SPD per Crop Milestone.',
				[3] = 'Grants +{4} STAT_OVERBLOOM.',
				[4] = 'Gain {5} more <RED>Copper</RED> from <GREEN>Garden Visitors</GREEN> and from analyzing <YELLOW>Mutations</YELLOW>.',
				[5] = 'If you own a level <GREEN>200 Rose Dragon</GREEN>, Grants <GOLD>+3</GOLD> STAT_FMF for every other unique maxed Farming Pet that you own.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants +&6{1} Farming Fortune per/&aFarming &7level.',
				[2] = '&7Grants &60.15 Farming Fortune &7and/&f0.1 Speed&7 per Crop Milestone.' ,
				[3] = '&7Grants &e+{4} Overbloom&7.',
				[4] = '&7Gain &a20% &7more &cCopper &7from &aGarden/&aVisitors&7 and from analyzing &eMutations&7.',
				[5] = '&7If you own a level &a200 Rose Dragon&7,/&7Grants &6+3 Farming Fortune for/&7every other unique maxed Farming/&7Pet that you own.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_FMF per level',
				[2] = '+{2} STAT_FMF and +{3} STAT_SPD per level',
				[3] = '+{4} STAT_OVERBLOOM per level',
				[4] = '+{5} more Copper per level',
				[5] = 'Only active on level 200',
			},
		},
		variables = {
			legendary = {
				ability_count = 5,
				[1] = {
					base = 1.5,
					per_lvl = 0.015,
					color = 'Orange',
				},
				[2] = {
					base = 0.075,
					per_lvl = 0.00075,
					color = 'Orange',
				},
				[3] = {
					base = 0.05,
					per_lvl = 0.0005,
					color = 'White',
				},
				[4] = {
					base = 20,
					per_lvl = 0.2,
					color = 'Yellow',
				},
				[5] = {
					base = 10,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Scatha'] = {
		id = 'SCATHA',
		rarities = { 'R', 'E', 'L' },
		sellPrice = { 1000, 2000, 5000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Mining Speed', bonus = 1 },
			{ name = 'Mining Fortune', bonus = 1.25 },
		},
		abilities = {
			name = {
				[1] = 'Burrowing',
				[2] = 'Drill Infusion',
				[3] = 'Bejeweled Eyes',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants a <GREEN>+</GREEN>{1} chance to find <YELLOW>Treasure Chests</YELLOW> while mining.',
				[2] = 'Grants <GOLD>+</GOLD>{2}<GOLD>☘ Gemstone Fortune</GOLD> to Drills.',
				[3] = 'Earn <GREEN>+</GREEN>{3} {{Gemstone Powder}} from all sources.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants a &a+{1}% &7chance to find/&eTreasure Chests &7while mining.',
				[2] = '&7Grants &6+{2} Gemstone Fortune &7to/&7Drills.',
				[3] = '&7Earn &a+{3}% &dGemstone Powder &7from all/&7sources.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance to find <YELLOW>Treasure Chests</YELLOW> while mining per level',
				[2] = '+{2} more <GOLD>☘ Gemstone Fortune</GOLD> to Drills per level',
				[3] = '+{3} more {{Gemstone Powder}} from all sources per level',
			},
		},
		variables = {
			rare = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Gold',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1.25,
					color = 'Gold',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Seal'] = {
		id = 'SEAL',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 100, 500, 1000, 2000, 5000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Fishing Speed', bonus = 0.35 },
			{ name = 'Sea Creature Chance', bonus = 0.05 },
			{ name = 'Treasure Chance', bonus = 0.01 },
		},
		abilities = {
			name = {
				[1] = 'Showboater',
				[2] = 'Peak Performance',
				[3] = 'Amphibious',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases your chance of catching {{Purple|Bouncy Beach Balls}} and {{Gold|Giant Bouncy Beach Balls}} during the {{Blue|Year of the Seal}} by {1}.',
				[2] = 'Gain a {2} chance to materialize some {{Blue|Treasure Bait}} in your inventory upon catching Treasure. Materializes {{Green|Golden Bait}} instead during the {{Blue|Year of the Seal}}.',
				[3] = 'Increases the base stats of this pet by {3} during the {{Blue|Year of the Seal}}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases your chance of catching/&5Bouncy Beach Balls &7and &6Giant Bouncy/&6Beach Balls &7during the &9Year of the/&9Seal &7by &a{1}%&7.',
				[2] = '&7Gain a &a{2}% &7chance to materialize/&7some &9Treasure Bait &7in your/&7inventory upon catching &6Treasure&7. /&7Materializes &aGolden Bait &7instead /&7during the &9Year of the Seal&7.',
				[3] = '&7Increases the base stats of this pet/&7by &a{3}% &7during the &9Year of the Seal&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance to catch Bouncy and Giant Bouncy Beach Balls',
				[2] = '+{2} higher chance to gain Treasure Bait on treasure catch',
				[3] = '+{3} more base stats during Year of the Seal',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.035,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.05,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Sheep'] = {
		id = 'SHEEP',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 250, 5000, 10000, 25000, 50000 },
		petType = 'Alchemy Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Ability Damage', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Mana Saver',
				[2] = 'Overheal',
				[3] = 'Dungeon Wizard',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Reduces the STAT_MANA cost of abilities by {1}.',
				[2] = 'Gives a {2} shield after not taking damage for <GREEN>10s</GREEN>.',
				[3] = 'Increases your total STAT_MANA by {3} while in [[Dungeons]].',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Reduces the mana cost of/&7abilities by &a{1}%',
				[2] = '&7Gives a &a{2}% &7shield after/&7not taking damage for 10s.',
				[3] = '&7Increases your total mana by/&7&a{3}% &7while in dungeons.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_MANA reduction per level',
				[2] = '+{2} tougher shield per level',
				[3] = '+{3} more STAT_MANA per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Silverfish'] = {
		id = 'SILVERFISH',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 50, 500, 2500, 5000, 10000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Defense', bonus = 1 },
			{ name = 'Mining Fortune', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Magnetic',
				[2] = 'Experienced Burrower',
				[3] = 'Dexterity',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Earn +{1} more Exp when mining.',
				[2] = 'Grants <DARK_AQUA>+</DARK_AQUA>{2}STAT_MW.',
				[3] = 'Grants <ORANGE>+</ORANGE>{3} STAT_MS and permanent <YELLOW>Haste I/II/III</YELLOW>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Earn &a+{1}% &7more Exp when mining.',
				[2] = '&7Grants &3+{2}☯ Mining Wisdom&7.',
				[3] = '&7Grants &6+{3} Mining Speed &7and/&7permanent &eHaste I\\/II\\/III&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more Exp per level',
				[2] = '+{2} STAT_MW per level',
				[3] = '+{3} STAT_MS per level and +1 Haste level at Lvl 50 & 100'
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Dark_Aqua',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.25,
					color = 'Dark_Aqua',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
				[3] = {
					per_lvl = 1.5,
					color = 'Orange'
				},
			},
		},
	},

	['Skeleton'] = {
		id = 'SKELETON',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 250, 5000, 10000, 25000, 50000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Crit Chance', bonus = 0.15 },
			{ name = 'Crit Damage', bonus = 0.3 },
		},
		abilities = {
			name = {
				[1] = 'Bone Arrows',
				[2] = 'Combo',
				[3] = 'Skeletal Defense',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increase arrow damage by {1} which is doubled while in [[Dungeons]]',
				[2] = 'Gain a combo stack for every bow hit granting +<GREEN>3</GREEN> STAT_STR. Max {2} stacks, stacks disappear after 8 seconds.',
				[3] = 'Your skeleton shoots an arrow dealing <GREEN>30x</GREEN> your STAT_CD when a mob gets close to you (5s cooldown)',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increase arrow damage by &a{1}%/&7which is doubled while in dungeons.',
				[2] = '&7Gain a combo stack for every bow hit/&7granting +&a3 &c Strength&7. Max &a{2}/&7stacks, stacks disappear after 8/&7seconds.',
				[3] = '&7Your skeleton shoots an arrow/&7dealing &a30x &7your &9 Crit Damage/&7when a mob gets close to you (5s/&7cooldown).',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher arrow damage increase per level',
				[2] = '+{2} more stacks per level',
				[3] = nil,
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.35,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.17,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.2,
					color = 'Green',
				},
			},
		},
	},

	['Skeleton Horse'] = {
		id = 'SKELETON_HORSE',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Intelligence', bonus = 0.75 },
			{ name = 'Speed', bonus = 1.5 },
		},
		abilities = {
			name = {
				[1] = 'High Stride',
				[2] = 'Stampede',
				[3] = 'Trample',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Grants permanent <AQUA>Jump Boost IV</AQUA>.',
				[2] = 'Mob kills grant a stack of <YELLOW>+</YELLOW>{1} STAT_AS and <RED>+</RED>{2} STAT_STR for <GREEN>5s</GREEN>.\n<DARK_GRAY>(Max 20 stacks)</DARK_GRAY>',
				[3] = 'After falling <GREEN>20</GREEN> or more blocks, absorb your fall damage and deal {3} of your weapon\'s STAT_DMG for every block fallen to mobs within <GREEN>3</GREEN> blocks.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Grants permanent &bJump Boost IV&7.',
				[2] = '&7Mob kills grant a stack of &e+{1} /&eAttack Speed &7and &c+{2}  Strength/&7for &a5s&7./&8(Max 20 stacks)',
				[3] = '&7After falling &a20 &7or more blocks,/&7absorb your fall damage and deal &a{3}%/&7of your weapon\'s &c Damage &7for/&7every block fallen to mobs within &a3/&7blocks.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = '+0.2 STAT_SPD and +0.05 STAT_STR per level',
				[3] = '+0.045% of STAT_DMG per level'
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					base = 0,
					per_lvl = 0.01,
					color = 'Yellow',
				},
				[2] = {
					base = 0,
					per_lvl = 0.1,
					color = 'Red',
				},
				[3] = {
					base = 0.75,
					per_lvl = 0.0625,
					color = 'Green',
					suffix = '%%',
				}
			},
		},
	},
	
	['Sloth'] = {
		id = 'SLOTH',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 25000, 50000, 0, 0, 0 }, -- need more info
		petType = 'Foraging Pet',
		stats = {
			{ name = 'Sweep', bonus = 0.1 },
			{ name = 'Foraging Fortune', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Slow Start',
				[2] = 'Stronk Arm',
				[3] = 'Starlyn\'s Favorite',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Every <GREEN>60s</GREEN>, your next cut gains +{1} STAT_SWEEP and +{2} STAT_FORF.',
				[2] = 'Gains +{3} STAT_SWEEP and +{4} STAT_FORF on <DARK_GREEN>Axe</DARK_GREEN> throws.',
				[3] = 'Cutting <GREEN>Trees</GREEN> give +{5} more points towards <LIGHT_PURPLE>Starlyn Contests</LIGHT_PURPLE>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Every &a60s&7, your next cut gains/&2+{1}  Sweep &7and &6+{2}  Foraging/&6Fortune&7.',
				[2] = '&7Gains &2+{3}  Sweep &7and &6+{4}/&6Foraging Fortune &7on &2Axe &7throws.',
				[3] = '&7Cutting &aTrees &7give &a+{5}% &7more points/&7towards &dStarlyn Contests&7.',				
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} STAT_SWEEP and +{2} STAT_FORF per level',
				[2] = '+{3} STAT_SWEEP and +{4} STAT_FORF per level',
				[3] = '+{5} more [[Starlyn Contests]] points per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.15,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Gold',
				},				
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Gold',
				},				
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Gold',
				},			
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.5,
					color = 'Gold',
				},							
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Gold',
				},			
				[3] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[4] = {
					per_lvl = 1,
					color = 'Gold',
				},							
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.25,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Gold',
				},			
				[3] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[4] = {
					per_lvl = 1,
					color = 'Gold',	
				},
				[5] = {
					per_lvl = 0.2,
					color = 'Gold',	
					suffix = '%%',					
				},				
			},
		},
	},
	
	['Slug'] = {
		id = 'SLUG',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 5000000 },
		petType = 'Farming Pet',
		stats = {
			{ name = 'Defense', bonus = 0.2 },
			{ name = 'Intelligence', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Slow and Steady',
				[2] = 'Pest Friends',
				[3] = 'Repugnant Aroma',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'When fishing in the <RED>Crimson Isle</RED>, <GREEN>Slugfish</GREEN> take <GREEN>{1}</GREEN> less time to catch.',
				[2] = 'Grants +{2} STAT_BPC.',
				[3] = 'When farming in a plot affected by a <GREEN>Sprayonator</GREEN>, gain +{3} STAT_FMF.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7When fishing in the &cCrimson/&cIsle&7, &aSlugfish &7take &a{1}%/&7less time to catch.',
				[2] = '&7Grants &2+{2} Bonus Pest/&2Chance&7.',
				[3] = '&7When farming in a plot/&7affected by a &aSprayonator&7,/&7gain &6+{3} Farming Fortune&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = 'Slugfish take {1} less time to catch per level',
				[2] = '+{2} more STAT_BPC per level',
				[3] = '+{3} more STAT_FMF per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Dark Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Dark Green',
				},
				[3] = {
					per_lvl = 1,
					color = 'Gold',
				},
			},
		},
	},

	['Snail'] = {
		id = 'SNAIL',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 1000, 25000, 50000, 100000, 250000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Defense', bonus = 1 },
			{ name = 'Intelligence', bonus = 1 },
		},
		abilities = {
			name = {
				[1] = 'Red Sand Enjoyer',
				[2] = 'Slow and Steady',
				[3] = 'Slimy Reach',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '<BLUE>Red Sand Minions</BLUE> work {1} faster while on your island.',
				[2] = 'Convert every {2}STAT_SPD you have above <WHITE>100</WHITE> into <GOLD>+1</GOLD>STAT_BKF.',
				[3] = 'Grants <YELLOW>+</YELLOW>{3}STAT_MSPR while mining mining <BLUE>Blocks</BLUE>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&9Red Sand Minions &7work &a{1}% &7faster/&7while on your &bPrivate Island&7.',
				[2] = '&7Convert every &f{2} Speed &7you have/&7above &f100 &7into &6+1 Block Fortune&7.',
				[3] = '&7Grants &e+{3} Mining Spread &7while/&7mining &9Blocks&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '<GREEN>+</GREEN>{1} more Red Sand Minion speed per level',
				[2] = '{2} less <WHITE>✦ Speed</WHITE> needed to gain <GOLD>+1 Block Fortune</GOLD>, per level',
				[3] = '<YELLOW>+</YELLOW>{3} more <YELLOW>▚ Mining Spread</YELLOW> per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 6,
					per_lvl = -0.03,
					color = 'White',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 6,
					per_lvl = -0.03,
					color = 'White',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 5,
					per_lvl = -0.03,
					color = 'White',
				},
				[3] = {
					per_lvl = 4,
					color = 'Yellow',
				},
			},
		},
	},

	['Snowman'] = {
		id = 'SNOWMAN',
		rarities = { 'L', 'M' },
		sellPrice = { 2000000, 2000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Damage', bonus = 0.25 },
			{ name = 'Strength', bonus = 0.25 },
			{ name = 'Crit Damage', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Blizzard',
				[2] = 'Frostbite',
				[3] = 'Snow Cannon',
				[4] = 'Ouch!',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Enemies within {1} blocks are slowed by <GREEN>25%</GREEN> and deal {2} less damage.',
				[2] = 'Your freezing aura slows enemy attacks causing you to take {3} reduced damage.',
				[3] = 'Shoots a snowball towards an enemy when you attack dealing {4} of your last dealt melee damage, capped at <WHITE>200,000</WHITE>. <DARK_GRAY>(1s cooldown).</DARK_GRAY>',
				[4] = 'Your snowballs have <GREEN>50%</GREEN> chance of dealing <RED>double</RED> damage!',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Enemies within &a{1} &7blocks are slowed/&7by &a25% &7and deal &a{2}% &7less damage.',
				[2] = '&7Your freezing aura slows enemy/&7attacks causing you to take &a{3}%/&7reduced damage.',
				[3] = '&7Shoots a snowball towards an enemy/&7when you attack dealing &a{4}% &7of/&7your last dealt melee damage,/&7capped at &f200,000&7. &8(1s cooldown).',
				[4] = '&7Your snowballs have &a50% &7chance of/&7dealing &cdouble &7damage!',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more blocks per level, +{2} higher damage reduction per level',
				[2] = '+{3} higher damage reduction per level',
				[3] = '+{4} higher damage scaling per level',
				[4] = nil,
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.08,
					base = 8,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					base = 10,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				petimage = 'Snowman Pet (Mythic)',
				ability_count = 4,
				[1] = {
					per_lvl = 0.08,
					base = 8,
					color = 'Green',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					per_lvl = 0.1,
					base = 10,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Spider'] = {
		id = 'SPIDER',
		rarities = { 'C', 'U', 'R', 'E', 'L', 'M' },
		sellPrice = { 250, 5000, 10000, 25000, 50000, 100000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.5 },
			{ name = 'Crit Chance', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'One With the Spider',
				[2] = 'Web-Weaver',
				[3] = 'Spider Whisperer',
				[4] = 'Web Battlefield',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Applies {1} STAT_STR to all <DARK_RED>Arachnal Ж</DARK_RED> weapons, armor, and equipment you have equipped.',
				[2] = 'Upon hitting a monster it becomes slowed by {2}.',
				[3] = 'Spider, Cave Spider and Tarantula minions work {3} faster while on your island.',
				[4] = 'Killing mobs grants {4} STAT_STR and {5} STAT_MF for <GREEN>40s</GREEN> to all players staying within <GREEN>20</GREEN> blocks of where they died. <DARK_GRAY>Stacks up to 10 times.</DARK_GRAY>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Applies &c{1}  Strength &7to all/&4Arachnal  &7weapons, armor, and/&7equipment you have equipped.',
				[2] = '&7Upon hitting a monster it becomes/&7slowed by &a{2}%',
				[3] = '&7Spider, Cave Spider and Tarantula/&7minions work &a{3}% &7faster while on/&7your island.',
				[4] = '&7Killing mobs grants &c+{4} &cStrength/&7and &b+{5} Magic Find &7for &a40s &7to all /&7players staying within &a20 &7blocks of/&7where they died. &8Stacks up to 10/&8times.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_STR per level',
				[2] = '+{2} higher slowness per level',
				[3] = '+{3} higher speed boost per level',
				[4] = '+{4} STAT_STR and +{5} STAT_MF per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 1,
					per_lvl = 0.02,
					color = 'Red',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					base = 2,
					per_lvl = 0.04,
					color = 'Red',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					base = 3,
					per_lvl = 0.06,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					base = 4,
					per_lvl = 0.08,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 5,
					per_lvl = 0.1,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					base = 5,
					per_lvl = 0.1,
					color = 'Red',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					base = 0,
					per_lvl = 0.06,
					color = 'Red',
				},
				[5] = {
					base = 0,
					per_lvl = 0.01,
					color = 'Aqua',
				},
			},
		},
	},

	['Spinosaurus'] = {
		id = 'SPINOSAURUS',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Fishing Speed', bonus = 0.5 },
			{ name = 'Sea Creature Chance', bonus = 0.05 },
			{ name = 'Trophy Chance', bonus = 0.05 }
		},
		abilities = {
			name = {
				[1] = 'Sharp Attitude',
				[2] = 'Pursuit',
				[3] = 'Primordial Fisher',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '[[Sea Creatures]] spawn with {1} of their maximum health missing.',
				[2] = 'Increases the chance of catching <GOLD>GOLD</GOLD> and <AQUA>DIAMOND</AQUA> tier [[Trophy Fish]] by {2}.',
				[3] = 'Increases this pet\'s base stats by {3} during rain.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&bSea Creatures &7spawn with &a{1}% &7of/&7their maximum health missing.',
				[2] = '&7Increases the chance of catching/&6&lGOLD&r&7 and &b&lDIAMOND&r&7 tier &6Trophy/&6Fish &7by &a{2}%&7.',
				[3] = '&7Increases this pet\'s base stats by/&a{3}% &7during &brain&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} health missing per level',
				[2] = '+{2} trophy fish chance per level',
				[3] = '+{3} base stat increase per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Spirit'] = {
		id = 'SPIRIT',
		rarities = { 'E', 'L' },
		sellPrice = { 2000, 5000 },
		petType = 'Combat Pet',
		isPassive = true,
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Speed', bonus = 0.3 },
		},
		abilities = {
			name = {
				[1] = 'Spirit Assistance',
				[2] = 'Spirit Cooldowns',
				[3] = 'Half Life',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Spawns and assists you when you are a ghost in dungeons.',
				[2] = 'Reduces the cooldown of your ghost abilities in dungeons by {1}.',
				[3] = 'If you are the first player to die in a dungeon, the score penalty for that death is reduced to <GREEN>1</GREEN>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Spawns and assists you when/&7you are a ghost in Dungeons.',
				[2] = '&7Reduces the cooldown of your/&7ghost abilities in dungeons by/&7&a{1}%&7.',
				[3] = '&7If you are the first player to/&7die in a dungeon, the score/&7penalty for that death is/&7reduced to &a1&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = '+{1} higher cooldown reduction per level',
				[3] = nil,
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.45,
					base = 5,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.45,
					base = 5,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Squid'] = {
		id = 'SQUID',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 100, 500, 100000, 200000, 500000 },
		petType = 'Fishing Pet',
		stats = {
			{ name = 'Health', bonus = 0.5 },
			{ name = 'Intelligence', bonus = 0.5 },
		},
		abilities = {
			name = {
				[1] = 'More Ink',
				[2] = 'Ink Specialty',
				[3] = 'Fishing Wisdom Boost',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain a {1} chance to get double drops from squids.',
				[2] = 'Buffs the [[Ink Wand]] by {2} STAT_DMG and {3} STAT_STR.',
				[3] = 'Grants <DARK_AQUA>+</DARK_AQUA>{4} STAT_FSW.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain a &a{1}% &7chance to get/&7double drops from squids.',
				[2] = '&7Buffs the &5Ink Wand &7by &a{2} &c/&cDamage &7and &a{3} &c Strength.',
				[3] = '&7Gives &3+{4}☯ Fishing/&3Wisdom&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} higher chance per level',
				[2] = '+{2} more STAT_DMG per level; +{3} more STAT_STR per level',
				[3] = '+{4} more STAT_FSW per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.1,
					color = 'Green',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
				},
				[3] = {
					per_lvl = 0.2,
					color = 'Green',
				},
				[4] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
			},
		},
	},

	['T-Rex'] = {
		id = 'TYRANNOSAURUS',
		rarities = { 'L' },
		sellPrice = { 500000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.75 },
			{ name = 'Crit Chance', bonus = 0.05 },
			{ name = 'Ferocity', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Close Combat',
				[2] = 'Ferocious Roar',
				[3] = 'Tyrant',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Deal {1} more damage to enemies within 1.5 blocks.',
				[2] = 'Attacks have a {2} chance to stun the target (10s cooldown).',
				[3] = 'Combat stats granted by pet items on this pet are increased by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Deal &a{1}% &7more &cdamage &7to enemies/&7within 1.5 blocks.',
				[2] = '&7Attacks have a &a{2}% &7chance to stun/&7the target &8(10s cooldown).',
				[3] = '&7Combat stats granted by pet items on/&7this pet are increased by &a{3}%&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell
				[1] = '+{1} damage per level',
				[2] = '+{2} chance to stun per level',
				[3] = '+{3} combat stats from pet items per level',
			},
		},
		variables = {
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Tarantula'] = {
		id = 'TARANTULA',
		rarities = { 'E', 'L', 'M' },
		sellPrice = { 2000, 100000, 150000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', bonus = 0.1 },
			{ name = 'Crit Chance', bonus = 0.1 },
			{ name = 'Crit Damage', bonus = 0.3 },
		},
		abilities = {
			name = {
				[1] = 'Webbed Cells',
				[2] = 'Eight Legs',
				[3] = 'Arachnid Slayer',
				[4] = 'Web Battlefield',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = '<RED>Tarantula Broodfather\'s</RED> STAT_VIT is {1} less effective against you.',
				[2] = 'Decreases the STAT_MC of [[Spider Boots|Spider]], [[Tarantula Boots|Tarantula]] and [[Spirit Boots|Spirit]] boots by {2}.',
				[3] = 'Gain {3} Combat XP against <GREEN>Spiders</GREEN>.',
				[4] = 'Killing mobs grants {4} STAT_STR and {5} STAT_MF for <GREEN>40s</GREEN> to all players staying within <GREEN>20</GREEN> blocks of where they died. <DARK_GRAY>Stacks up to 10 times.</DARK_GRAY>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&cTarantula Broodfather\'s &4 Vitality/&7reduction is &a{1}% &7less effective/&7against you.',
				[2] = '&7Decreases the mana cost of/&7Spider, Tarantula and Spirit/&7boots by &a{2}%',
				[3] = '&7Gain &b{3}x &7Combat XP/&7against &aSpiders&7.',
				[4] = '&7Killing mobs grants &c+{4}/&cStrength &7and &b+{5} Magic Find/&7for &a40s &7to all players/&7staying within &a20 &7blocks/&7of where they died. &8Stacks/&8up to 10 times.'
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} less effective STAT_VIT reduction per level',
				[2] = '{2} less STAT_MC per level',
				[3] = '+{3} more Combat XP per level',
				[4] = '+{4} STAT_STR and +{5} STAT_MF per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					base = 1.0,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
			},
			mythic = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					base = 1.0,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
				[4] = {
					base = 0,
					per_lvl = 0.06,
					color = 'Red',
				},
				[5] = {
					base = 0,
					per_lvl = 0.01,
					color = 'Aqua',
				},
			},
		},
	},

	['Tiger'] = {
		id = 'TIGER',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 5000, 12500, 50000, 500000, 5000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Strength', base = 5, bonus = 0.1 },
			{ name = 'Crit Chance', bonus = 0.05 },
			{ name = 'Crit Damage', bonus = 0.5 },
			{ name = 'Ferocity', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Merciless Swipe',
				[2] = 'Hemorrhage',
				[3] = 'Apex Predator',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain <RED>+</RED>{1} STAT_FER.',
				[2] = 'Melee attacks reduce healing by {2} for <GREEN>10</GREEN> seconds.',
				[3] = 'Deal +{3} damage against targets with no other mobs within 15 blocks.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &c+{1}% &c Ferocity.',
				[2] = '&7Melee attacks reduce healing/&7by &6{2}% &7for &a10s.',
				[3] = '&7Deal &c+{3}% &7damage against/&7targets with no other mobs/&7within &a15 &7blocks.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_FER per level',
				[2] = '+{2} higher healing reduction per level',
				[3] = '+{3} more damage per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Red',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Red',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.3,
					color = 'Gold',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.55,
					color = 'Gold',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.55,
					color = 'Gold',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Turtle'] = {
		id = 'TURTLE',
		rarities = { 'E', 'L' },
		sellPrice = { 500000, 5000000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', base = 50, bonus = 0.25 },
			{ name = 'Defense', base = 100, bonus = 0.5 },
			{ name = 'True Defense', bonus = 0.15 },
		},
		abilities = {
			name = {
				[1] = 'Turtle Tactics',
				[2] = 'Genius Amniote',
				[3] = 'Unflippable',
				[4] = 'Turtle Shell',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Gain +{1} STAT_DEF and an additional <GREEN>+10%</GREEN> STAT_DEF when standing still.',
				[2] = 'Grants +{2} STAT_DEF to 4 players within 50 blocks of you.',
				[3] = 'Gain <GREEN>immunity</GREEN> to knockback.',
				[4] = 'When under <RED>40%</RED> maximum HP, you take {3} less damage. Gain +{4} STAT_VIT after taking 10 hits.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Gain &a+{1}%  Defense &7and an/&7additional &a+10% &a Defense &7when/&7standing still.',
				[2] = '&7Grants &a+{2}%  Defense &7to 4/&7players within 50 blocks of you.',
				[3] = '&7Gain &aimmunity &7to knockback.',
				[4] = '&7When under &c40% &7maximum HP, you take/&a{3}% &7less damage. Gain &4+{4} &4Vitality/&7after taking 10 hits.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more STAT_DEF per level',
				[2] = '+{2} more STAT_DEF per level',
				[3] = nil,
				[4] = '+{3} less damage taken while below <RED>40%</RED> maximum HP taken per level and +{4} more STAT_VIT per level',
			},
		},
		variables = {
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.27,
					base = 3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.015,
					base = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 4,
				[1] = {
					per_lvl = 0.27,
					base = 3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.015,
					base = 1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
				[4] = {
					base = 5,
					per_lvl = 0.05,
					color = 'Dark Red',
					suffix = '%%',
				},
			},
		},
	},

	['Wisp'] = {
		id = 'DROPLET_WISP,FROST_WISP,GLACIAL_WISP,SUBZERO_WISP', -- TODO: Change to table once we figure out why it doesn't work
		rarities = { 'U', 'R', 'E', 'L' },
		sellPrice = { 12500, 50000, 500000, 5000000 },
		petType = 'Gabagool Pet, feed to gain XP',
		stats = {
			{ name = 'Health', bonus = 1 },	
			{ name = 'Damage', bonus = 0.1 },
		},
		abilities = {
			name = {
				[1] = 'Drophammer',
				[2] = 'Bulwark',
				[3] = 'Blaze Slayer',
				[4] = 'Extinguish',
				[5] = 'Ephemeral Stability',
				[6] = 'Icehammer',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Lets you break fire pillars <GREEN>2x</GREEN> faster, healing you for {1} of your max <RED></RED> over <GREEN>3s</GREEN>.',
				[2] = 'Kill Blazes to gain defense against them and demons.\nBonus: <GREEN>+0</GREEN> & <WHITE>+0</WHITE> Next Upgrade: <GREEN>+30</GREEN> & <WHITE>+3</WHITE> <DARK_GRAY>(</DARK_GRAY><GREEN>0</GREEN>/<RED>100</RED><DARK_GRAY>)</DARK_GRAY>',
				[3] = 'Gain {2} Combat XP against <GREEN>Blazes</GREEN>.',
				[4] = 'While in combat on the Crimson Isle, spawn a pool every <GREEN>8s</GREEN>. Bathing in it heals {3}<RED></RED> now and {4}<RED></RED>/s for <GREEN>8s</GREEN>.',
				[5] = 'Regenerate mana <AQUA>40%</AQUA> faster',
				[6] = 'Lets you break fire pillars <GREEN>2x</GREEN> faster, healing you for {1} of your max <RED></RED> over <GREEN>3s</GREEN>.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Lets you break fire pillars &a2x/&7faster, healing you for &c{1}% &7of your/&7max &c &7over &a3s&7.',
				[2] = '&7Kill Blazes to gain defense against/&7them and demons./&7Bonus: &a+0 & &f+0/&7Next Upgrade: &a+30 & &f+3 &8(&a0&7\\/&c100&8)',
				[3] = '&7Gain &b{2}x &7Combat XP &7against &aBlazes&7.',
				[4] = '&7While in combat on the Crimson Isle,/&7spawn a pool every &a8s&7./&7Bathing in it heals &c{2}% &7now and/&c{3}%&7\\/s for &a8s&7.',
				[5] = '&7Regenerate mana &b40% &7faster',
				[6] = '&7Lets you break fire pillars &a2x/&7faster, healing you for &c{1}% &7of your/&7max &c &7over &a3s&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = nil,
				[2] = nil,
				[3] = '+{2} more Combat XP per level',
				[4] = nil,
				[5] = nil,
				[6] = nil,
			},
		},
		variables = {
			uncommon = {
				petname = 'Droplet Wisp',
				ability_count = 3,
				[1] = {
					base = 15,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					base = 1,
					per_lvl = 0.003,
					color = 'Aqua',
					suffix = 'x',
				},
			},
			rare = {
				petname = 'Frost Wisp',
				stats = {
					{ name = 'Health', bonus = 2.5 },	
					{ name = 'True Defense', bonus = 0.15 },
					{ name = 'Damage', bonus = 0.15 },
					{ name = 'Intelligence', bonus = 0.5 },
				},
				ability_indices = {6, 2, 3, 4},
				[1] = {
					base = 25,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					base = 1,
					per_lvl = 0.004,
					color = 'Aqua',
					suffix = 'x',
				},
				[3] = {
					base = 15,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[4] = {
					base = 4,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
			},
			epic = {
				petname = 'Glacial Wisp',
				stats = {
					{ name = 'Health', bonus = 4 },	
					{ name = 'True Defense', bonus = 0.3 },
					{ name = 'Damage', bonus = 0.2 },
					{ name = 'Intelligence', bonus = 1.25 },
				},
				ability_indices = {6, 2, 3, 4},
				[1] = {
					base = 40,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					base = 1,
					per_lvl = 0.0045,
					color = 'Aqua',
					suffix = 'x',
				},
				[3] = {
					base = 20,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[4] = {
					base = 7,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
			},
			legendary = {
				petname = 'Subzero Wisp',
				stats = {
					{ name = 'Health', bonus = 6 },	
					{ name = 'True Defense', bonus = 0.35 },
					{ name = 'Damage', bonus = 0.25 },
					{ name = 'Intelligence', bonus = 2.5 },
				},
				ability_indices = {6, 2, 3, 4, 5},
				[1] = {
					base = 50,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[2] = {
					base = 1,
					per_lvl = 0.005,
					color = 'Aqua',
					suffix = 'x',
				},
				[3] = {
					base = 25,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
				[4] = {
					base = 10,
					per_lvl = 0,
					color = 'Red',
					suffix = '%%',
				},
			},
		},
	},

	['Witch'] = {
		id = 'WITCH',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 100, 500, 1000, 2000, 5000 },
		petType = 'Alchemy Pet',
		stats = {
			{ name = 'Intelligence', bonus = 1 },
			{ name = 'Alchemy Wisdom', bonus = 0.05 },
		},
		abilities = {
			name = {
				[1] = 'Toil and Trouble',
				[2] = 'Alchemism',
				[3] = 'Witching Hour',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Increases your chance of dropping {{Gold|Ingredients}} during the {{Purple|Year of the Witch}} by {1}.',
				[2] = 'Reduces how long {{Purple|Potions}} take to brew by {2}.',
				[3] = 'Increases the base stats of this pet by {3} during the {{Purple|Year of the Witch}}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Increases your chance of dropping/&6Ingredients &7during the &5Year of the/&5Witch by &a{1}%&7.',
				[2] = '&7Reduces how long &5Potions &7take to/&7brew by &a{2}%&7.',
				[3] = '&7Increases the base stats of this pet/&7by &a{3}% &7during the &5Year of the Witch&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '{1} more chance per level',
				[2] = '{2} more reduction per level',
				[3] = '{3} more increase per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.75,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.4,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.5,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				}
			},
		},
	},

	['Wither Skeleton'] = {
		id = 'WITHER_SKELETON',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 1000, 25000, 50000, 100000, 250000 },
		petType = 'Mining Pet',
		stats = {
			{ name = 'Defense', bonus = 0.25 },
			{ name = 'Strength', bonus = 0.25 },
			{ name = 'Crit Chance', bonus = 0.05 },
			{ name = 'Crit Damage', bonus = 0.25 },
			{ name = 'Intelligence', bonus = 0.25 },
		},
		abilities = {
			name = {
				[1] = 'Stronger Bones',
				[2] = 'Wither Blood',
				[3] = 'Death\'s Touch',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Take {1} less damage from {{mt|Skeletal}} mobs.',
				[2] = 'Deal {2} more damage against {{mt|Wither}} mobs.',
				[3] = 'Upon hitting an enemy inflict the wither effect for {3} damage over 3 seconds. <DARK_GRAY>Does not stack</DARK_GRAY>',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Take &a{1}% &7less damage from &f/&fSkeletal &7mobs.',
				[2] = '&7Deal &a{2}% &7more damage to &8 Wither/&7mobs.',
				[3] = '&7Upon hitting an enemy inflict/&7the wither effect for &a{3}%/&7damage over 3 seconds./&8Does not stack',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '{1} less damage per level',
				[2] = '+{2} more damage per level',
				[3] = '+{3} more damage per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 1,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 2,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

	['Wolf'] = {
		id = 'WOLF',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 250, 5000, 10000, 25000, 50000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 0.5 },
			{ name = 'True Defense', bonus = 0.1 },
			{ name = 'Crit Damage', bonus = 0.1 },
			{ name = 'Speed', bonus = 0.2 },
		},
		abilities = {
			name = {
				[1] = 'Alpha Dog',
				[2] = 'Pack Leader',
				[3] = 'Combat Wisdom Boost',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Take {1} less damage from wolves.',
				[2] = 'Gain {2} STAT_CD for every nearby wolf <DARK_GRAY>(max 10 wolves)</DARK_GRAY>.',
				[3] = 'Grants <DARK_AQUA>+</DARK_AQUA>{3}STAT_CW.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Take &a{1}% &7less damage from/&7wolves.',
				[2] = '&7Gain &a{2} &9 Crit Damage/&9&7for every nearby wolf monsters./&8Max 10 wolves',
				[3] = '&7Grants &3+{3}☯ Combat/&3Wisdom&7.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} less damage per level',
				[2] = '+{2} more STAT_CD per wolf per level',
				[3] = '+{3} higher STAT_CW boost per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.2,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					per_lvl = 0.3,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					per_lvl = 0.15,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.3,
					color = 'Dark_Aqua',
				},
			},
		},
	},

	['Zombie'] = {
		id = 'ZOMBIE',
		rarities = { 'C', 'U', 'R', 'E', 'L' },
		sellPrice = { 50, 500, 2500, 5000, 10000 },
		petType = 'Combat Pet',
		stats = {
			{ name = 'Health', bonus = 1 },
			{ name = 'Crit Damage', bonus = 0.3 },
		},
		abilities = {
			name = {
				[1] = 'Bite Shield',
				[2] = 'Rotten Blade',
				[3] = 'Living Dead',
			},
			desc = {
				-- the description of abilities used in the two top cells
				[1] = 'Reduce the damage taken from zombies by {1}.',
				[2] = 'Deal {2} more damage to {{mt|Undead}} mobs',
				[3] = 'Increases stats of all <DARK_GREEN>Undead ༕</DARK_GREEN> armor by {3}.',
			},
			tooltip = {
				-- the description of abilities used in the tooltip
				[1] = '&7Reduce the damage taken from/&7zombies by &a{1}%&7.',
				[2] = '&7Deal &a{2}% &7more damage to &2 Undead/&7mobs', -- full stop missing at the end, as of 0.24.3
				[3] = '&7Increases all stats on/&2Undead ༕ &7armor by &a{3}%.',
			},
			bonus_desc = {
				-- the description of abilities used in the bottom cell.
				[1] = '+{1} more damage reduction per level',
				[2] = '+{2} more damage per level',
				[3] = '+{3} higher stats boost per level',
			},
		},
		variables = {
			common = {
				ability_count = 1,
				[1] = {
					base = 5,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			uncommon = {
				ability_count = 1,
				[1] = {
					base = 10,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
			},
			rare = {
				ability_count = 2,
				[1] = {
					base = 10,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 25,
					per_lvl = 1.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			epic = {
				ability_count = 2,
				[1] = {
					base = 15,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 25,
					per_lvl = 1.25,
					color = 'Green',
					suffix = '%%',
				},
			},
			legendary = {
				ability_count = 3,
				[1] = {
					base = 15,
					per_lvl = 0.1,
					color = 'Green',
					suffix = '%%',
				},
				[2] = {
					base = 25,
					per_lvl = 1.25,
					color = 'Green',
					suffix = '%%',
				},
				[3] = {
					per_lvl = 0.25,
					color = 'Green',
					suffix = '%%',
				},
			},
		},
	},

}