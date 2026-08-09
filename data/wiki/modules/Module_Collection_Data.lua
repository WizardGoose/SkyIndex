local all_collections = {
	['Acacia Log'] = {
		minion = 'Acacia',
		[1] = {
			required = 50,
			reward = {
				{ 'Acacia Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Acacia Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Acacia Log', type = 'Recipe' },
				{ 'Portal to Savanna Woodland', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Savanna Bow', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Savanna Biome Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 2000, type = 'Foraging Experience' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Repelling Candle', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Acacia Birdhouse', type = 'Recipe' },
			},
		},
	},
	['Agaricus Cap'] = {
		[1] = {
			required = 20,
			reward = {
				{ 'Agaricus Cap Bunch', type = 'Recipe' },
			},
		},
		[2] = {
			required = 60,
			reward = {
				{ 'Agaricus Soup', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Agaricus Cap Cap', type = 'Recipe' },
			},
		},
		[4] = {
			required = 200,
			reward = {
				{ 'Agaricus Chumcap', type = 'Recipe' },
			},
		},
	},
	['Birch Log'] = {
		minion = 'Birch',
		[1] = {
			required = 50,
			reward = {
				{ 'Birch Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Beginner Foraging Sack', type = 'Recipe' },
				{ 'Birch Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Portal to Birch Park', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Sculptor\'s Axe', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Small Foraging Sack', type = 'Recipe' },
				{ 'Enchanted Birch Log', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 'Birch Forest Biome Stick', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Medium Foraging Sack', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 'Large Foraging Sack', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Large Enchanted Foraging Sack', type = 'Recipe' },
			},
		},
	},
	['Blaze Rod'] = {
		minion = 'Blaze',
		[1] = {
			required = 50,
			reward = {
				{ 'Blaze Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{
					'{{Blue|Fire Aspect}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Fire Aspect &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Enchanted Blaze Powder', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{ 'Fire Talisman', type = 'Recipe' },
				{ 'Blaze Belt', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Flame}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Flame &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Enchanted Blaze Rod', type = 'Recipe' },
				{ 'Blaze Wax', type = 'Recipe' },
				{ 'Blaze Pet', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Blaze Armor', type = 'Recipe' },
				{ 'Vanquished Blaze Belt', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 10000, type = 'Combat Experience' },
			},
		},
	},
	['Bone'] = {
		minion = 'Skeleton',
		[1] = {
			required = 50,
			reward = {
				{ 'Skeleton Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Enchanted Bone Meal', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Power}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Power &7Exp Discount &a(-25%)',
				},
				{ 'Skeleton Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Skeleton Hat', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Bone', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 1000, type = 'Combat Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Hurricane Bow', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Skeleton\'s Helmet', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Runaan\'s Bow', type = 'Recipe' },
			},
		},
		[10] = {
			required = 150000,
			reward = {
				{ 'Enchanted Bone Block', type = 'Recipe' },
			},
		},
	},
	['Bonzo'] = {
		collectionType = 'Boss',
		collectionImage = 'Bonzo Head',
		[1] = {
			required = 25,
			reward = {
				{'Red Nose', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 50,
			reward = {
				{'Bonzo\'s Mask', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 100,
			reward = {
				{'Golden Bonzo Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 150,
			reward = {
				{'Bonzo\'s Staff', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{'Diamond Bonzo Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Cactus'] = {
		minion = 'Cactus',
		[1] = {
			required = 100,
			reward = {
				{ 'Cactus Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Cactus Armor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Resistance Potion', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Cactus Green', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Desert Island', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Piercing}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Piercing &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{
					'{{Blue|Thorns}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Thorns &7Exp Discount &a(-25%)',
				},
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Cactus', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
	},
	['Caducous Stem'] = {
		[1] = {
			required = 20,
			reward = {
				{ 'Caducous Stem Bunch', type = 'Recipe' },
			},
		},
		[2] = {
			required = 60,
			reward = {
				{ 'Caducous Legume', type = 'Recipe' },
			},
		},
		[3] = {
			required = 150,
			reward = {
				{ 'Caducous Extract', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Caducous Feeder', type = 'Recipe' },
			},
		},
	},
	['Carrot'] = {
		minion = 'Carrot',
		[1] = {
			required = 100,
			reward = {
				{ 'Carrot Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Simple Carrot Candy', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Carrot Bait', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1750,
			reward = {
				{ 'Enchanted Carrot', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Enchanted Carrot on a Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Great Carrot Candy', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Enchanted Golden Carrot', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Sprout Armor', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 'Superb Carrot Candy', type = 'Recipe' },
			},
		},
	},
	['Chili Pepper'] = {
		[1] = {
			required = 10,
			reward = {
				{ 'Re-heated Gummy Polar Bear', type = 'Recipe' },
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Sulphuric Coal', type = 'Recipe' },
			},
		},
		[3] = {
			required = 75,
			reward = {
				{ 'Capsaicin Eyedrops', type = 'Recipe' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Entropy Suppressor', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Book (Cayenne IV)', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 'Stuffed Chili Pepper', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Jalapeno Book', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 'Enchanted Book (Habanero Tactics IV)', type = 'Recipe' },
			},
		},
		[9] = {
			required = 20000,
			reward = {
				{ 'Enchanted Book (Tabasco II)', type = 'Recipe' },
			},
		},
	},
	['Clay Ball'] = {
		minion = 'Clay',
		[1] = {
			required = 50,
			reward = {
				{ 'Clay Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Enchanted Clay Ball', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Respiration}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Respiration &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{
					'{{Blue|Frail}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Frail &7Exp Discount &a(-25%)',
				},
			},
		},
		[5] = {
			required = 1500,
			reward = {
				{ 'Clay Bracelet', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 2500, type = 'Fishing Experience' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Enchanted Clay Block', type = 'Recipe' },
			},
		},
	},
	['Coal'] = {
		minion = 'Coal',
		[1] = {
			required = 50,
			reward = {
				{ 'Coal Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Beginner Mining Sack', type = 'Recipe' },
				{
					'{{Blue|Smelting Touch}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Smelting Touch &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Coal', type = 'Recipe' },
				{ 'Haste Potion', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Wither Skeleton Pet', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Charcoal', type = 'Recipe' },
				{ 'Small Mining Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Travel Scroll to the Gold Mine', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Coal Block', type = 'Recipe' },
				{ 'Medium Mining Sack', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Lava Bucket', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Large Mining Sack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Large Enchanted Mining Sack', type = 'Recipe' },
			},
		},
	},
	['Cobblestone'] = {
		minion = 'Cobblestone',
		[1] = {
			required = 50,
			reward = {
				{ 'Cobblestone Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Stone Platform', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Silverfish Pet', type = 'Recipe' },
				{ 'Auto Smelter', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Cobblestone', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Compactor', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 1000, type = 'Mining Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Haste Ring', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Hyper Furnace', type = 'Recipe' },
			},
		},
		[9] = {
			required = 40000,
			reward = {
				{ 'Haste Artifact', type = 'Recipe' },
			},
		},
		[10] = {
			required = 70000,
			reward = {
				{ 'Super Compactor 3000', type = 'Recipe' },
			},
		},
	},
	['Cocoa Beans'] = {
		minion = 'Cocoa Beans',
		[1] = {
			required = 75,
			reward = {
				{ 'Cocoa Beans Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 200,
			reward = {
				{ 50, type = 'Farming Experience' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Portal to Mushroom Island', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2000,
			reward = {
				{ 'Enchanted Cocoa Beans', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Travel Scroll to Mushroom Island', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Enchanted Cookie', type = 'Recipe' },
			},
		},
		[7] = {
			required = 20000,
			reward = {
				{ 'Adrenaline Potion', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Enchanted Book (Replenish I)', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 30000, type = 'Farming Experience' },
			},
		},
	},
	['Dark Oak Log'] = {
		minion = 'Dark Oak',
		[1] = {
			required = 50,
			reward = {
				{ 'Dark Oak Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Dark Oak Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Dark Oak Log', type = 'Recipe' },
				{ 'Portal to Dark Thicket', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Roofed Forest Island', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Roofed Forest Biome Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 2000, type = 'Foraging Experience' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Growth}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Growth &7Exp Discount &a(-25%)',
				},
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Armor of Growth', type = 'Recipe' },
			},
		},
	},
	['Diamond'] = {
		minion = 'Diamond',
		[1] = {
			required = 50,
			reward = {
				{ 'Diamond Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{
					'{{Blue|Execute}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Execute &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Portal to the Deep Caverns', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Diamond', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Critical}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Critical &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Diamond Spreading', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Hardened Diamond Armor', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Diamond Block', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Perfect Armor', type = 'Recipe' },
			},
		},
	},
	['Emerald'] = {
		minion = 'Emerald',
		[1] = {
			required = 50,
			reward = {
				{ 'Emerald Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Talisman of Coins', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Magnetic Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Emerald', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Emerald Ring', type = 'Recipe' },
			},
		},
		[6] = {
			required = 15000,
			reward = {
				{ 'Access to [[bank|{{Green|/bank}}]] (Requires [[Cookie Buff]])', type = 'Custom', rewardstr = '  &7Access to &a\\/bank\n  &8(Requires Cookie Buff)', nolink = true },
				{ 'Personal Bank Item', type = 'Recipe' },
			},
		},
		[7] = {
			required = 30000,
			reward = {
				{ 'Enchanted Emerald Block', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Emerald Blade', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 'Emerald Armor', type = 'Recipe' },
			},
		},
	},
	['End Stone'] = {
		minion = 'End Stone',
		[1] = {
			required = 50,
			reward = {
				{ 'End Stone Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'End Biome Stick', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Portal to The End', type = 'Recipe' },
				{ 'Endermite Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted End Stone', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Silence Block', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Haste Block', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Mining Experience' },
			},
		},
		[8] = {
			required = 15000,
			reward = {
				{ 'Travel Scroll to the End', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Catalyst', type = 'Recipe' },
			},
		},
		[10] = {
			required = 50000,
			reward = {
				{ 'End Stone Sword', type = 'Recipe' },
			},
		},
	},
	['Ender Pearl'] = {
		minion = 'Enderman',
		[1] = {
			required = 50,
			reward = {
				{ 'Enderman Minion', type = 'Recipe' },
				{ 'Silent Pearl', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Enchanted Ender Pearl', type = 'Recipe' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{
					'{{Blue|Ender Slayer}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Ender Slayer &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{ 'Small Dragon Sack', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Ender Bow', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Medium Dragon Sack', type = 'Recipe' },
				{ 'Enchanted Eye of Ender', type = 'Recipe' },
			},
		},
		[7] = {
			required = 15000,
			reward = {
				{ 'Teleport Pad', type = 'Trade' },
				{ 'Absolute Ender Pearl', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Aspect of the End', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Large Dragon Sack', type = 'Recipe' },
				{ 'Saving Grace', type = 'Recipe' },
			},
		},
	},
	['Feather'] = {
		minion = 'Chicken',
		[1] = {
			required = 50,
			reward = {
				{
					'{{Blue|Projectile Protection}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Projectile Protection &7Exp Discount &a(-25%)',
				},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{
					'{{Blue|Feather Falling}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Feather Falling &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Archery Potion', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Feather Talisman', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Feather', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Dragon Tracer}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Dragon Tracer &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Feather Ring', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{
					'{{Blue|Snipe}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Snipe &7Exp Discount &a(-25%)',
				},
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Feather Artifact', type = 'Recipe' },
			},
		},
	},
	['Fig Log'] = {
		[1] = {
			required = 500,
			reward = {
				{ 'Tiny Scaffolding', type = 'Recipe' },
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Fig Log', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Medium Scaffolding', type = 'Recipe' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Fig Hew', type = 'Recipe' },
			},
		},
		[5] = {
			required = 10000,
			reward = {
				{ 'Large Scaffolding', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Figstone', type = 'Recipe' },
				{ 'Figstone Splitter', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 'Sparrow Shard', type = 'Recipe' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Fig Armor', type = 'Recipe' },
			},
		},
		[9] = {
			required = 150000,
			reward = {
				{ 100000, type = 'Foraging Experience' },
				{
					'{{Gray|+}}{{Green|1 Foraging}} Level Cap',
					type = 'Custom',
					nolink = true,
					rewardstr = '&8+&a1 Foraging &7Level Cap',
				}
			},
		},
	},
	['Gemstone'] = {
		[1] = {
			required = 100,
			reward = {
				{ 'Small Gemstone Sack', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Flawed Gemstone', type = 'Recipe', link = 'Gemstone' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Medium Gemstone Sack', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{ 'Talisman of Power', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Fine Gemstone', type = 'Recipe', link = 'Gemstone' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Ring of Power', type = 'Recipe' },
				{ 'Large Gemstone Sack', type = 'Recipe' },
			},
		},
		[7] = {
			required = 100000,
			reward = {
				{ 'Power Scroll', type = 'Recipe' },
			},
		},
		[8] = {
			required = 250000,
			reward = {
				{ 'Enchanted Book (Prismatic I)', type = 'Recipe' },
			},
		},
		[9] = {
			required = 500000,
			reward = {
				{ 'Flawless Gemstone', type = 'Recipe', link = 'Gemstone' },
			},
		},
		[10] = {
			required = 1000000,
			reward = {
				{ 'Artifact of Power', type = 'Recipe' },
				{ 'Perfect Gemstone', type = 'Dwarven Forge Recipe', link = 'Gemstone' },
			},
		},
		[11] = {
			required = 2000000,
			reward = {
				{ 'Gemstone Gauntlet', type = 'Recipe' },
			},
		},
	},
	['Ghast Tear'] = {
		minion = 'Ghast',
		[1] = {
			required = 20,
			reward = {
				{ 'Ghast Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{
					'{{Blue|Giant Killer}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Giant Killer &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Enchanted Ghast Tear', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Vampirism}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Vampirism &7Exp Discount &a(-25%)',
				},
				{ 'Ghast Cloak', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Silver Fang', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Meteor Chunk', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Vanquished Ghast Cloak', type = 'Recipe' },
			},
		},
	},
	['Glacite'] = {
		[1] = {
			required = 100,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Glacite', type = 'Recipe' },
				{ 'Cold Resistance Potion', type = 'Recipe' },
			},
		},
		[3] = {
			required = 5000,
			reward = {
				{ 'Glacite Amalgamation', type = 'Dwarven Forge Recipe' },
			},
		},
		[4] = {
			required = 10000,
			reward = {
				{ 'Glacite Golem Pet', type = 'Recipe' },
			},
		},
		[5] = {
			required = 25000,
			reward = {
				{ 'Frigid Husk', type = 'Dwarven Forge Recipe' },
			},
		},
		[6] = {
			required = 50000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[7] = {
			required = 100000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[8] = {
			required = 250000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[9] = {
			required = 500000,
			reward = {
				{ 10000, type = 'Mining Experience' },
			},
		},
	},
	['Glowstone Dust'] = {
		minion = 'Glowstone',
		[1] = {
			required = 50,
			reward = {
				{ 'Glowstone Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Portal to the Crimson Isle', type = 'Recipe' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Enchanted Glowstone Dust', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{ 'Travel Scroll to the Crimson Isle', type = 'Recipe' },
				{ 'Glowstone Gauntlet', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Enchanted Glowstone', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Enchanted Redstone Lamp', type = 'Recipe' },
				{ 'Shiny Prism', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Vanquished Glowstone Gauntlet', type = 'Recipe' },
			},
		},
	},
	['Gold Ingot'] = {
		minion = 'Gold',
		[1] = {
			required = 50,
			reward = {
				{ 'Gold Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Cleaver', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Looting}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Looting &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Portal to the Gold Mine', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Gold Ingot', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 'Absorption Potion', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Scavenger}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Scavenger &7Exp Discount &a(-25%)',
				},
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 'Enchanted Gold Block', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{
					'{{Blue|Fortune}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Fortune &7Exp Discount &a(-25%)',
				},
			},
		},
		[10] = {
			required = 500000,
			reward = {
				{ 'Enchanted Clock', type = 'Recipe' },
			},
		},
	},
	['Gravel'] = {
		minion = 'Gravel',
		[1] = {
			required = 50,
			reward = {
				{ 'Gravel Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Flint Shovel', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Portal to the Spider\'s Den', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{
					'{{Blue|Sharpness}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Sharpness &7Exp Discount &a(-25%)',
				},
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Flint', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|First Strike}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9First Strike &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Critical Potion', type = 'Recipe' },
			},
		},
		[8] = {
			required = 15000,
			reward = {
				{ 'Travel Scroll to Spider\'s Den', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 5000, type = 'Mining Experience' },
			},
		},
	},
	['Gunpowder'] = {
		minion = 'Creeper',
		[1] = {
			required = 50,
			reward = {
				{ 'Creeper Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Creeper Hat', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Blast Protection}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Blast Protection &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Gunpowder', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Thunderlord}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Thunderlord &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Firework Rocket', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Combat Experience' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Creeper Pants', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Explosive Bow', type = 'Recipe' },
			},
		},
	},
	['Half-Eaten Carrot'] = {
		[1] = {
			required = 50,
			reward = {
				{ 'Nearly-Whole Carrot', type = 'Recipe' },
			},
		},
		[2] = {
			required = 400,
			reward = {
				{ 'Orange Chestplate', type = 'Recipe' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Exportable Carrots', type = 'Recipe' },
			},
		},
		[4] = {
			required = 3500,
			reward = {
				{ 'Nearly Coherent doR gnihsiF', type = 'Recipe' },
			},
		},
	},
	['Hard Stone'] = {
		minion = 'Hard Stone',
		[1] = {
			required = 50,
			reward = {
				{ 'Hard Stone Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Heat Armor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 5000,
			reward = {
				{ 'Enchanted Hard Stone', type = 'Recipe' },
			},
		},
		[4] = {
			required = 50000,
			reward = {
				{ 'Scorched Topaz', type = 'Dwarven Forge Recipe' },
			},
		},
		[5] = {
			required = 150000,
			reward = {
				{ 'Flamebreaker Armor', type = 'Recipe' },
			},
		},
		[6] = {
			required = 300000,
			reward = {
				{ 'Concentrated Stone', type = 'Recipe' },
			},
		},
		[7] = {
			required = 1000000,
			reward = {
				{ 'Silex', type = 'Recipe' },
			},
		},
	},
	['Helix Log'] = {
		[1] = {
			required = 500,
			reward = {
				{ 'Travel Scroll to Torrhus Canyon', type = 'Recipe' },
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Helix Log', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Lumberjack Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Portal to the Torrhus Canyon', type = 'Recipe' },
			},
		},
		[5] = {
			required = 10000,
			reward = {
				{ 'Lumberjack Ring', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Helixis', type = 'Recipe' },
				{ 'Helix Chopper', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 'Hawk Shard', type = 'Recipe' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Lumberjack Artifact', type = 'Recipe' },
				{ 'Helix Armor', type = 'Recipe' },
			},
		},
		[9] = {
			required = 150000,
			reward = {
				{ 150000, type = 'Foraging Experience' },
				{
					'{{Gray|+}}{{Green|1 Foraging}} Level Cap',
					type = 'Custom',
					nolink = true,
					rewardstr = '&8+&a1 Foraging &7Level Cap',
				}
			},
		},
	},
	['Hemovibe'] = {
		minion = 'Vampire',
		[1] = {
			required = 50,
			reward = {
				{ 'Vampire Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Blood Donor Talisman', type = 'Recipe' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Hemoglass', type = 'Recipe' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Enchanted Book (Transylvanian IV)', type = 'Recipe' },
			},
		},
		[5] = {
			required = 15000,
			reward = {
				{ 'Displaced Leech', type = 'Recipe' },
			},
		},
		[6] = {
			required = 30000,
			reward = {
				{ 'Blood Donor Ring', type = 'Recipe' },
			},
		},
		[7] = {
			required = 75000,
			reward = {
				{ 'Full-Jaw Fanging Kit', type = 'Recipe' },
			},
		},
		[8] = {
			required = 150000,
			reward = {
				{ 'Presumed Gallon of Red Paint', type = 'Recipe' },
			},
		},
		[9] = {
			required = 250000,
			reward = {
				{ 'Hemobomb', type = 'Recipe' },
				{ 'Blood Donor Artifact', type = 'Recipe' },
			},
		},
	},
		['Honeycomb'] = {
		[1] = {
			required = 50,
			reward = {
				{ 'Honeycomb Talisman', type = 'Recipe' },
				{ 'Fun-Sized Pot of Honeycomb', type = 'Recipe' },
			},
		},
		[2] = {
			required = 200,
			reward = {
				{ 'Enchanted Honeycomb', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Honeycomb Ring', type = 'Recipe' },
				{ 'Family-Sized Pot of Honeycomb', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Honey Badger Shard', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2000,
			reward = {
				{ 'Honeycomb Artifact', type = 'Recipe' },
				{ 'Jumbo Pot of Honeycomb', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Honeycomb Block', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Queen Bee Shard', type = 'Recipe' },
			},
		},
		[8] = {
			required = 20000,
			reward = {
				{ 'Bee Saliva', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Honeycomb Necklace', type = 'Recipe' },
			},
		},
	},	
	['Ice'] = {
		minion = 'Ice',
		[1] = {
			required = 50,
			reward = {
				{ 'Ice Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Ice Bait', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Packed Ice', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Enchanted Ice', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Magical Water Bucket', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Glacial Ring', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Packed Ice', type = 'Recipe' },
				{ 'Ice Cube', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Glacial Artifact', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 'Frozen Blaze Armor', type = 'Recipe' },
			},
		},
		[10] = {
			required = 250000,
			reward = {
				{ 'Frozen Scythe', type = 'Recipe' },
			},
		},
		[11] = {
			required = 500000,
			reward = {
				{ 'Glacial Scythe', type = 'Recipe' },
			},
		},
	},
	['Ink Sac'] = {
		[1] = {
			required = 20,
			reward = {
				{ 'Squid Hat', type = 'Recipe' },
			},
		},
		[2] = {
			required = 40,
			reward = {
				{ 'Dark Bait', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Enchanted Ink Sac', type = 'Recipe' },
			},
		},
		[4] = {
			required = 200,
			reward = {
				{ 'Deep Ocean Biome Stick', type = 'Recipe' },
			},
		},
		[5] = {
			required = 400,
			reward = {
				{
					'{{Blue|Caster}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Caster &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 800,
			reward = {
				{ 'Blindness Potion', type = 'Recipe' },
			},
		},
		[7] = {
			required = 1500,
			reward = {
				{
					'{{Blue|Angler}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Angler &7Exp Discount &a(-25%)',
				},
			},
		},
		[8] = {
			required = 2500,
			reward = {
				{ 'Bait Ring', type = 'Recipe' },
			},
		},
		[9] = {
			required = 4000,
			reward = {
				{ 'Ink Wand', type = 'Recipe' },
			},
		},
	},
	['Iron Ingot'] = {
		minion = 'Iron',
		[1] = {
			required = 50,
			reward = {
				{ 'Iron Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Golem Hat', type = 'Recipe' },
				{ 'Prospecting Armor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Protection}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Protection &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Iron Ingot', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Budget Hopper', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Golem Armor', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Iron Block', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Golem Sword', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Enchanted Hopper', type = 'Recipe' },
				{ 'Personal Deletor 4000', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Personal Deletor 5000', type = 'Recipe' },
			},
		},
		[11] = {
			required = 200000,
			reward = {
				{ 'Personal Deletor 6000', type = 'Recipe' },
			},
		},
		[12] = {
			required = 400000,
			reward = {
				{ 'Personal Deletor 7000', type = 'Recipe' },
			},
		},
	},
	['Jungle Log'] = {
		minion = 'Jungle',
		[1] = {
			required = 50,
			reward = {
				{ 'Jungle Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Jungle Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Jungle Log', type = 'Recipe' },
				{ 'Portal to Jungle Island', type = 'Recipe' },
				{ 'Ocelot Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Vines', type = 'Trade' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Jungle Biome Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 2000, type = 'Foraging Experience' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Treecapitator', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
	},
	['Kuudra'] = {
		collectionType = 'Boss',
		collectionImage = 'Infernal Kuudra Key',
		[1] = {
			required = 10,
			reward = {
				{'Common Kuudra Pet', type = 'Reward'},
				{'Crimson', amount = '400', type = 'Essence'},
				{'Kuudra Teeth', type = 'Reward'},
				{'10', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{'Kuudra Chunk', type = 'Reward'},
				{'Crimson', amount = '1000', type = 'Essence'},
				{'Kuudra Teeth', amount = '2', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 500,
			reward = {
				{'Meaty Kuudra Chunk', type = 'Reward'},
				{'Crimson', amount = '2500', type = 'Essence'},
				{'Kuudra Teeth', amount = '4', type = 'Reward'},
				{'20', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 2000,
			reward = {
				{'Hardened Kuudra Chunk', type = 'Reward'},
				{'Crimson', amount = '10000', type = 'Essence'},
				{'Kuudra Teeth', amount = '8', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{'Enriched Kuudra Chunk', type = 'Reward'},
				{'Crimson', amount = '20000', type = 'Essence'},
				{'Kuudra Teeth', amount = '12', type = 'Reward'},
				{'30', type = 'SkyBlock Experience'},
			},
		},
	},
	['Lapis Lazuli'] = {
		minion = 'Lapis',
		[1] = {
			required = 250,
			reward = {
				{ 'Lapis Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 500,
			reward = {
				{ 'Experience Bottle', type = 'Recipe' },
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Lapis Pickaxe', type = 'Recipe' },
				{
					'{{Blue|Experience}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Experience &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 2000,
			reward = {
				{ 'Enchanted Lapis Lazuli', type = 'Recipe' },
			},
		},
		[5] = {
			required = 10000,
			reward = {
				{ 'Grand Experience Bottle', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Experience Potion', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 'Enchanted Lapis Lazuli Block', type = 'Recipe' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Titanic Experience Bottle', type = 'Recipe' },
			},
		},
		[9] = {
			required = 150000,
			reward = {
				{ 'Experience Artifact', type = 'Recipe' },
			},
		},
		[10] = {
			required = 250000,
			reward = {
				{ 'Textbook', type = 'Recipe' },
			},
		},
	},
	['Leather'] = {
		minion = 'Cow',
		[1] = {
			required = 50,
			reward = {
				{ 'Cow Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Cow Hat', type = 'Recipe' },
				{ 'Milk Bucket', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Small Backpack', type = 'Recipe' },
				{ 'Horse Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Enchanted Leather', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Raw Beef', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 'Medium Backpack', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 5000, type = 'Farming Experience' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 'Saddle', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Large Backpack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 50000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
		[11] = {
			required = 100000,
			reward = {
				{ 'Greater Backpack', type = 'Recipe' },
			},
		},
	},
	['Lily Pad'] = {
		[1] = {
			required = 10,
			reward = {
				{ 'Lily Pad Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Blobfish Hat', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Healing Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 200,
			reward = {
				{ 'Enchanted Lily Pad', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Common Hook', type = 'Recipe' },
			},
		},
		[6] = {
			required = 1500,
			reward = {
				{ 'Whale Bait', type = 'Recipe' },
			},
		},
		[7] = {
			required = 3000,
			reward = {
				{ 'Rod of Champions', type = 'Recipe' },
			},
		},
		[8] = {
			required = 6000,
			reward = {
				{ 'Healing Ring', type = 'Recipe' },
			},
		},
		[9] = {
			required = 10000,
			reward = {
				{ 'Rod of Legends', type = 'Recipe' },
			},
		},
		[10] = {
			required = 25000,
			reward = {
				{ 'Condensed Lily Pad', type = 'Recipe' },
			},
		},
		[11] = {
			required = 50000,
			reward = {
				{ 'Frogspawn Bucket', type = 'Recipe' },
			},
		},
	},
	['Livid'] = {
		collectionType = 'Boss',
		collectionImage = 'Livid Head',
		[1] = {
			required = 50,
			reward = {
				{'Dark Orb', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{'Golden Livid Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 150,
			reward = {
				{'Livid Dagger', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 500,
			reward = {
				{'Last Breath', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 750,
			reward = {
				{'Shadow Assassin Chestplate', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			}
		},
		[7] = {
			required = 1000,
			reward = {
				{'Diamond Livid Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Living Metal Heart'] = {
		[1] = {
			required = 1,
			reward = {
				{ 'Snake-in-a-Boot', type = 'Recipe' },
			},
		},
		[2] = {
			required = 20,
			reward = {
				{ 'Living Metal Anchor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 60,
			reward = {
				{ 'Bluetooth Ring', type = 'Recipe' },
			},
		},
		[4] = {
			required = 100,
			reward = {
				{ 'Polarvoid Book', type = 'Recipe' },
			},
		},
	},
	['Lushlilac'] = {
		[1] = {
			required = 25,
			reward = {
				{ 'Lushlilac Bonbon', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Oceandy', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Prime Lushlilac Bonbon', type = 'Recipe' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 1000, type = 'Hunting Experience' },
				{ 1000, type = 'Foraging Experience' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Exalted Lushlilac Bonbon', type = 'Recipe' },
			},
		},
	},
	['Lotus'] = {
		[1] = {
			required = 25,
			reward = {
				{ 'Froggles', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Red Sweater', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Silver Lotus', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Silver Froggles', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Lotus Sinker', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Gold Lotus', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Golden Froggles', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Puddle Jumper Hook', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Trophy Line', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Diamond Lotus', type = 'Recipe' },
			},
		},
		[11] = {
			required = 250000,
			reward = {
				{ 'Diamond Froggles', type = 'Recipe' },
			},
		},
	},
	['Magma Cream'] = {
		minion = 'Magma Cube',
		[1] = {
			required = 50,
			reward = {
				{ 'Magma Cube Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{
					'{{Blue|Fire Protection}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Fire Protection &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 1000,
			reward = {
				{ 'Nether Biome Stick', type = 'Recipe' },
				{ 'Enchanted Magma Cream', type = 'Recipe' },
			},
		},
		[4] = {
			required = 2500,
			reward = {
				{ 'Magma Necklace', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Lava Bucket', type = 'Trade' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Lava Talisman', type = 'Recipe' },
				{ 'Searing Stone', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Vanquished Magma Necklace', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Whipped Magma Cream', type = 'Recipe' },
			},
		},
	},
	['Magmafish'] = {
		[1] = {
			required = 20,
			reward = {
				{ 'Magmafish Hat', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Hot Bait', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Silver Magmafish', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Magma Rod', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Corrupted Bait', type = 'Recipe' },
			},
		},
		[6] = {
			required = 15000,
			reward = {
				{ 'Small Lava Fishing Sack', type = 'Recipe' },
			},
		},
		[7] = {
			required = 30000,
			reward = {
				{ 'Gold Magmafish', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Inferno Rod', type = 'Recipe' },
			},
		},
		[9] = {
			required = 75000,
			reward = {
				{ 'Medium Lava Fishing Sack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Diamond Magmafish', type = 'Recipe' },
			},
		},
		[11] = {
			required = 250000,
			reward = {
				{ 'Large Lava Fishing Sack', type = 'Recipe' },
			},
		},
		[12] = {
			required = 500000,
			reward = {
				{ 'Hellfire Rod', type = 'Recipe' },
			},
		},
	},
	['Mangrove Log'] = {
		[1] = {
			required = 500,
			reward = {
				{ 'Travel Scroll to Murkwater Loch', type = 'Recipe' },
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Mangrove Log', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Mangrove Locket', type = 'Recipe' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Mangrove Vine', type = 'Recipe' },
			},
		},
		[5] = {
			required = 10000,
			reward = {
				{ 'Mangrove Gem', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Mangcore', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 'Seagull Shard', type = 'Recipe' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Mangrove Grippers', type = 'Recipe' },
			},
		},
		[9] = {
			required = 150000,
			reward = {
				{ 110000, type = 'Foraging Experience' },
				{
					'{{Gray|+}}{{Green|1 Foraging}} Level Cap',
					type = 'Custom',
					nolink = true,
					rewardstr = '&8+&a1 Foraging &7Level Cap',
				}
			},
		},
	},
	['Melon Slice'] = {
		minion = 'Melon',
		[1] = {
			required = 250,
			reward = {
				{ 'Melon Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 500,
			reward = {
				{ 100, type = 'Farming Experience' },
			},
		},
		[3] = {
			required = 1250,
			reward = {
				{ 250, type = 'Farming Experience' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Enchanted Melon Slice', type = 'Recipe' },
			},
		},
		[5] = {
			required = 15000,
			reward = {
				{ 'Enchanted Glistering Melon Slice', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Enchanted Melon', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 10000, type = 'Farming Experience' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 20000, type = 'Farming Experience' },
			},
		},
		[9] = {
			required = 250000,
			reward = {
				{ 50000, type = 'Farming Experience' },
				{ 'Juicy Nozzle', type = 'Recipe' },
			},
		},
	},
	['Mithril'] = {
		minion = 'Mithril',
		[1] = {
			required = 50,
			reward = {
				{ 'Mithril Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Enchanted Mithril', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Spelunker Potion', type = 'Recipe' },
				{ 'Mithril Golem Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 10000,
			reward = {
				{ 'Mithril Crystal', type = 'Recipe' },
			},
		},
		[5] = {
			required = 50000,
			reward = {
				{ 5000, type = 'Mining Experience' },
			},
		},
		[6] = {
			required = 100000,
			reward = {
				{ 'Dwarven Super Compactor', type = 'Recipe' },
			},
		},
		[7] = {
			required = 250000,
			reward = {
				{ 'Mithril Coat', type = 'Recipe' },
			},
		},
		[8] = {
			required = 500000,
			reward = {
				{ 'Mithril Infusion', type = 'Recipe' },
			},
		},
		[9] = {
			required = 1000000,
			reward = {
				{ 'Beacon I', type = 'Recipe' },
			},
		},
	},
	['Moonflower'] = {
		[1] = {
			required = 1000,
			reward = {
				{ 'Enchanted Moonflower', type = 'Recipe' },
			},
		},
		[2] = {
			required = 5000,
			reward = {
				{ 'Nightswitch', type = 'Recipe' },
			},
		},
		[3] = {
			required = 10000,
			reward = {
				{ 'Crow Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 25000,
			reward = {
				{ 'Compacted Moonflower', type = 'Recipe' },
			},
		},
		[5] = {
			required = 100000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
		[6] = {
			required = 250000,
			reward = {
				{ 'Moonstone', type = 'Recipe' },
			},
		},
		[7] = {
			required = 500000,
			reward = {
				{ 'Enchanted Book (Crop Fever I)', type = 'Recipe' },
			},
		},
		[8] = {
			required = 1000000,
			reward = {
				{ 'Moonlight Crystal', type = 'Recipe' },
			},
		},
	},
	['Mushroom'] = {
		minion = 'Mushroom',
		[1] = {
			required = 50,
			reward = {
				{ 'Mushroom Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Mushroom Armor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Bat Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Magical Mushroom Soup', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Brown Mushroom Block', type = 'Recipe' },
				{ 'Red Mushroom Block', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Red Mushroom', type = 'Recipe' },
				{ 'Enchanted Brown Mushroom', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Night Vision Charm', type = 'Recipe' },
				{ 'Mystical Mushroom Soup', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Brown Mushroom Block', type = 'Recipe' },
				{ 'Enchanted Red Mushroom Block', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
	},
	['Raw Mutton'] = {
		minion = 'Sheep',
		[1] = {
			required = 50,
			reward = {
				{ 'Sheep Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Small Husbandry Sack', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Sheep Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Mana Potion', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Raw Mutton', type = 'Recipe' },
				{ 'Small Husbandry Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Rainbow}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Rainbow &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Medium Husbandry Sack', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Cooked Mutton', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Horns of Torment', type = 'Recipe' },
				{ 'Large Husbandry Sack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Large Enchanted Husbandry Sack', type = 'Recipe' },
			},
		},
	},
	['Mycelium'] = {
		minion = 'Mycelium',
		[1] = {
			required = 50,
			reward = {
				{ 'Mycelium Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 500,
			reward = {
				{ 'Suspicious Stew', type = 'Recipe' },
			},
		},
		[3] = {
			required = 750,
			reward = {
				{ 'Enchanted Mycelium', type = 'Recipe' },
				{ 'Mooshroom Cow Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Mushroom Biome Stick', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Mycelium Dust', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Corrupt Soil', type = 'Recipe' },
			},
		},
		[7] = {
			required = 15000,
			reward = {
				{ 'Enchanted Mycelium Cube', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 10000, type = 'Mining Experience' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Shimmering Light Hood', type = 'Recipe' },
				{ 'Shimmering Light Tunic', type = 'Recipe' },
				{ 'Shimmering Light Trousers', type = 'Recipe' },
				{ 'Shimmering Light Slippers', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Gauntlet of Contagion', type = 'Recipe' },
			},
		},
	},
	['Necron'] = {
		collectionType = 'Boss',
		collectionImage = 'Wither Skeleton Skull',
		[1] = {
			required = 50,
			reward = {
				{'Wither Blood', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{'Golden Necron Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 150,
			reward = {
				{'Wither Helmet', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 500,
			reward = {
				{'Wither Leggings', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 750,
			reward = {
				{'Wither Chestplate', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			}
		},
		[7] = {
			required = 1000,
			reward = {
				{'Diamond Necron Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Nether Quartz'] = {
		minion = 'Quartz',
		[1] = {
			required = 50,
			reward = {
				{ 'Quartz Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Night Saver', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Day Saver', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Nether Quartz', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Minion Expander', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Quartz Block', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Night Crystal', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Day Crystal', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Solar Panel', type = 'Recipe' },
			},
		},
	},
	['Nether Wart'] = {
		minion = 'Nether Wart',
		[1] = {
			required = 50,
			reward = {
				{ 'Nether Wart Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Potion Bag', type = 'Upgrade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Potion Affinity Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Nether Wart', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 9, type = 'Potion Bag Slot' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 1500, type = 'Farming Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Potion Affinity Ring', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 9, type = 'Potion Bag Slot' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Potion Affinity Artifact', type = 'Recipe' },
			},
		},
		[10] = {
			required = 75000,
			reward = {
				{ 9, type = 'Potion Bag Slot' },
			},
		},
		[11] = {
			required = 100000,
			reward = {
				{ 'Mutant Nether Wart', type = 'Recipe' },
			},
		},
		[12] = {
			required = 250000,
			reward = {
				{ 9, type = 'Potion Bag Slot' },
			},
		},
	},
	['Netherrack'] = {
		[1] = {
			required = 50,
			reward = {
				{ 'Nether Wart Island', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Wounded Potion', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Nether Brick', type = 'Trade' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Netherrack', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Magical Lava Bucket', type = 'Recipe' },
			},
		},
	},
	['Oak Log'] = {
		minion = 'Oak',
		[1] = {
			required = 50,
			reward = {
				{ 'Oak Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Leaflet Armor', type = 'Recipe' },
				{ 'Oak Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Oak Log', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Small Storage', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Forest Biome Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 'Medium Storage', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Wood Affinity Talisman', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Large Storage', type = 'Recipe' },
			},
		},
	},
	['Obsidian'] = {
		minion = 'Obsidian',
		[1] = {
			required = 50,
			reward = {
				{ 'Obsidian Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{
					'{{Blue|Lethality}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Lethality &7Exp Discount &a(-25%)',
				},
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Gravity Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Obsidian', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Stun Potion', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Obsidian Tablet', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
				{ 50000, type = 'Mining Experience' },
			},
		},
	},
	['Potato'] = {
		minion = 'Potato',
		[1] = {
			required = 100,
			reward = {
				{ 'Potato Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 200,
			reward = {
				{ 'Portal to The Barn', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Vaccine Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1750,
			reward = {
				{ 'Enchanted Potato', type = 'Recipe' },
			},
		},
		[5] = {
			required = 5000,
			reward = {
				{ 'Venomous Potion', type = 'Recipe' },
			},
		},
		[6] = {
			required = 10000,
			reward = {
				{ 'Travel Scroll to The Barn', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Enchanted Baked Potato', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Hot Potato Book', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 'Tater Armor', type = 'Recipe' },
			},
		},
	},
	['Prismarine Crystals'] = {
		minion = 'Fishing',
		[1] = {
			required = 10,
			reward = {
				{ 'Sea Lantern Hat', type = 'Recipe' },
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Light Bait', type = 'Recipe' },
			},
		},
		[3] = {
			required = 50,
			reward = {
				{ 'Enchanted Prismarine Crystals', type = 'Recipe' },
			},
		},
		[4] = {
			required = 100,
			reward = {
				{
					'{{Blue|Aqua Affinity}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Aqua Affinity &7Exp Discount &a(-25%)',
				},
			},
		},
		[5] = {
			required = 200,
			reward = {
				{ 'Guardian Chestplate', type = 'Recipe' },
			},
		},
		[6] = {
			required = 400,
			reward = {
				{ 'Blessed Bait', type = 'Recipe' },
			},
		},
		[7] = {
			required = 800,
			reward = {
				{
					'{{Blue|Blessing}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Blessing &7Exp Discount &a(-25%)',
				},
			},
		},
	},
	['Prismarine Shard'] = {
		minion = 'Fishing',
		[1] = {
			required = 10,
			reward = {
				{
					'{{Blue|Impaling}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Impaling &7Exp Discount &a(-25%)',
				},
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Prismarine Blade', type = 'Recipe' },
			},
		},
		[3] = {
			required = 50,
			reward = {
				{ 'Enchanted Prismarine Shard', type = 'Recipe' },
			},
		},
		[4] = {
			required = 100,
			reward = {
				{ 'Prismarine Sinker', type = 'Recipe' },
			},
		},
		[5] = {
			required = 200,
			reward = {
				{ 'Prismarine Bow', type = 'Recipe' },
			},
		},
		[6] = {
			required = 400,
			reward = {
				{ 'Weather Node', type = 'Recipe' },
			},
		},
		[7] = {
			required = 800,
			reward = {
				{ 'Prismarine Necklace', type = 'Recipe' },
			},
		},
	},
	['Pufferfish'] = {
		minion = 'Fishing',
		[1] = {
			required = 20,
			reward = {
				{ 'Spiked Bait', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Beginner Fishing Sack', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Pufferfish Hat', type = 'Recipe' },
				{
					'{{Blue|Spiked Hook}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Spiked Hook &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 150,
			reward = {
				{ 'Enchanted Pufferfish', type = 'Recipe' },
				{
					'{{Blue|Cleave}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Cleave &7Exp Discount &a(-25%)',
				},
			},
		},
		[5] = {
			required = 400,
			reward = {
				{ 'Small Fishing Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 800,
			reward = {
				{
					'{{Blue|Depth Strider}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Depth Strider &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 2400,
			reward = {
				{ 'Medium Fishing Sack', type = 'Recipe' },
			},
		},
		[8] = {
			required = 4800,
			reward = {
				{ 'Hotspot Bait', type = 'Recipe' },
			},
		},
		[9] = {
			required = 9000,
			reward = {
				{ 'Large Fishing Sack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 18000,
			reward = {
				{ 'Large Enchanted Fishing Sack', type = 'Recipe' },
			},
		},
	},
	['Pumpkin'] = {
		minion = 'Pumpkin',
		[1] = {
			required = 40,
			reward = {
				{ 'Pumpkin Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Farmer Orb', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Pumpkin', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{
					'{{Blue|Cubism}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Cubism &7Exp Discount &a(-25%)',
				},
				{ 'Spooky Bait', type = 'Recipe' },					
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Training Dummy', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 5000, type = 'Farming Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Lantern Helmet', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Farm Crystal', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Farmer Boots', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Polished Pumpkin', type = 'Recipe' },
			},
		},
		[11] = {
			required = 250000,
			reward = {
				{ 'Rancher\'s Boots', type = 'Recipe' },
			},
		},
	},
	['Raw Chicken'] = {
		minion = 'Chicken',
		[1] = {
			required = 50,
			reward = {
				{ 'Chicken Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Bridge Egg', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Chicken Pet', type = 'Recipe' },
				{ 'Chicken Hat', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Raw Chicken', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Egg', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 5000, type = 'Farming Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Cake', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Agility Potion', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Super Enchanted Egg', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Omega Enchanted Egg', type = 'Recipe' },
			},
		},
	},
	['Raw Cod'] = {
		minion = 'Fishing',
		[1] = {
			required = 20,
			reward = {
				{ 'Fish Hat', type = 'Recipe' },
				{ 'Minnow Bait', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Fishing Minion', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Fishing Bag', type = 'Upgrade' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Pond Island', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 2500, type = 'Fishing Experience' },
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{ 'Enchanted Raw Cod', type = 'Recipe' },
			},
		},
		[7] = {
			required = 2500,
			reward = {
				{ 9, type = 'Fishing Bag Slot' },
			},
		},
		[8] = {
			required = 15000,
			reward = {
				{ 'Enchanted Cooked Cod', type = 'Recipe' },
			},
		},
		[9] = {
			required = 30000,
			reward = {
				{ 9, type = 'Fishing Bag Slot' },
			},
		},
		[10] = {
			required = 45000,
			reward = {
				{ 9, type = 'Fishing Bag Slot' },
			},
		},
		[11] = {
			required = 60000,
			reward = {
				{ 9, type = 'Fishing Bag Slot' },
			},
		},
	},
	['Raw Porkchop'] = {
		minion = 'Pig',
		[1] = {
			required = 50,
			reward = {
				{ 'Pig Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 100, type = 'Farming Experience' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Pigman Pet', type = 'Recipe' },
				{ 'Enchanted Raw Porkchop', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 1000, type = 'Farming Experience' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Piggy Bank', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 5000, type = 'Farming Experience' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Cooked Porkchop', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 25000, type = 'Farming Experience' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Pigman Sword', type = 'Recipe' },
			},
		},
	},
	['Raw Rabbit'] = {
		minion = 'Rabbit',
		[1] = {
			required = 50,
			reward = {
				{ 'Rabbit Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Rabbit Armor', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Rabbit Potion', type = 'Recipe' },
				{ 'Rabbit Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Rabbit Foot', type = 'Recipe' },
				{ 'Enchanted Raw Rabbit', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Luck}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Luck &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Rabbit Hide', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{
					'{{Blue|Luck of the Sea}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Luck of the Sea &7Exp Discount &a(-25%)',
				},
				{ 'Enchanted Cooked Rabbit', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Pet Luck Potion', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
	},
	['Raw Salmon'] = {
		minion = 'Fishing',
		[1] = {
			required = 20,
			reward = {
				{ 'Salmon Hat', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Dodge Potion', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{
					'{{Blue|Lure}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Lure &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Enchanted Raw Salmon', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Fish Bait', type = 'Recipe' },
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{ 'Salmon Armor', type = 'Recipe' },
			},
		},
		[7] = {
			required = 2500,
			reward = {
				{ 5000, type = 'Fishing Experience' },
			},
		},
		[8] = {
			required = 5000,
			reward = {
				{ 'Enchanted Cooked Salmon', type = 'Recipe' },
			},
		},
		[9] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Fishing Experience' },
			},
		},
	},
	['Red Sand'] = {
		minion = 'Red Sand',
		[1] = {
			required = 50,
			reward = {
				{ 'Red Sand Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 500,
			reward = {
				{ 'Enchanted Red Sand', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Mesa Biome Stick', type = 'Recipe' },
			},
		},
		[4] = {
			required = 10000,
			reward = {
				{ 'Enchanted Red Sand Cube', type = 'Recipe' },
				{ 'Snail Pet', type = 'Recipe' },
			},
		},
		[5] = {
			required = 15000,
			reward = {
				{ 'Ancient Cloak', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 10000, type = 'Mining Experience' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{ 'Berserker Armor', type = 'Recipe' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Everburning Flame', type = 'Recipe' },
			},
		},
	},
	['Redstone Dust'] = {
		minion = 'Redstone',
		[1] = {
			required = 100,
			reward = {
				{ 'Redstone Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Enchanted Redstone Dust', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[3] = {
			required = 750,
			reward = {
				{
					'{{Blue|Efficiency}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Efficiency &7Exp Discount &a(-25%)',
				},
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[4] = {
			required = 1500,
			reward = {
				{ 'Weather Stick', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Travel Scroll to Deep Caverns', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Personal Compactor 4000', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Enchanted Redstone Block', type = 'Recipe' },
				{ 'Personal Compactor 5000', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Personal Compactor 6000', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
		[9] = {
			required = 250000,
			reward = {
				{ 'Personal Compactor 7000', type = 'Recipe' },
				{ 6, type = 'Accessory Bag Slot' },
			},
		},
	},
	['Rotten Flesh'] = {
		minion = 'Zombie',
		[1] = {
			required = 50,
			reward = {
				{ 'Zombie Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Beginner Combat Sack', type = 'Recipe' },
				{ 'Zombie Pickaxe', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Smite}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Smite &7Exp Discount &a(-25%)',
				},
				{ 'Zombie Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Rotten Flesh', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Zombie Hat', type = 'Recipe' },
				{ 'Small Combat Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Zombie\'s Heart', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Zombie Sword', type = 'Recipe' },
				{ 'Medium Combat Sack', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Zombie Armor', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Large Combat Sack', type = 'Recipe' },
			},
		},
		[10] = {
			required = 100000,
			reward = {
				{ 'Large Enchanted Combat Sack', type = 'Recipe' },
			},
		},
	},
		['Ruby Veilshroom'] = {
		[1] = {
			required = 25,
			reward = {
				{ 'Travel Scroll to Torrhus Springs', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Enchanted Ruby Veilshroom', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Accelerative Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'June Bug', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Accelerative Ring', type = 'Recipe' },
			},
		},
		[6] = {
			required = 25000,
			reward = {
				{ 'Veilshroom Bunch', type = 'Recipe' },
			},
		},
		[7] = {
			required = 50000,
			reward = {
				{
					'{{stat|foraging_fortune|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1 Foraging Fortune',
				},
			},
		},
		[8] = {
			required = 100000,
			reward = {
				{ 'Accelerative Artifact', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 'Veilshroom Bracelet', type = 'Recipe' },
			},
		},
	},
	['Sadan'] = {
		collectionType = 'Boss',
		collectionImage = 'Sadan Head',
		[1] = {
			required = 50,
			reward = {
				{'Giant Tooth', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{'Golden Sadan Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 150,
			reward = {
				{'Necromancer Lord Helmet', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 500,
			reward = {
				{'Necromancer Lord Chestplate', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 750,
			reward = {
				{'Necromancer Sword', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			}
		},
		[7] = {
			required = 1000,
			reward = {
				{'Diamond Sadan Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Sand'] = {
		minion = 'Sand',
		[1] = {
			required = 50,
			reward = {
				{ 'Sand Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 250, type = 'Mining Experience' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Soul Sand', type = 'Trade' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Desert Biome Stick', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Sand', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 'Burning Potion', type = 'Recipe' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Hard Glass', type = 'Recipe' },
			},
		},
	},
	['Scarf'] = {
		collectionType = 'Boss',
		collectionImage = 'Scarf Head',
		[1] = {
			required = 25,
			reward = {
				{'Red Scarf', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 50,
			reward = {
				{'Scarf\'s Thesis', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 100,
			reward = {
				{'Golden Scarf Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 150,
			reward = {
				{'Adaptive Blade', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{'Diamond Scarf Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Sea Lumies'] = {
		[1] = {
			required = 25,
			reward = {
				{ 'Basic Fishing Net', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Enchanted Sea Lumies', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Bubbles of Air', type = 'Recipe' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Enchanted Book (Scuba I)', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Medium Fishing Net', type = 'Recipe' },
				{ 'Pressure Talisman', type = 'Recipe' },
			},
		},
		[6] = {
			required = 750,
			reward = {
				{ 'Diver\'s Armor', type = 'Recipe' },
			},
		},
		[7] = {
			required = 1000,
			reward = {
				{ 'Pressure Ring', type = 'Recipe' },
			},
		},
		[8] = {
			required = 2500,
			reward = {
				{ 'Abyssal Armor', type = 'Recipe' },
			},
		},
		[9] = {
			required = 5000,
			reward = {
				{ 'Turbo Fishing Net', type = 'Recipe' },
				{ 'Pressure Artifact', type = 'Recipe' },
			},
		},
	},
	['Seeds'] = {
		minion = 'Wheat',
		[1] = {
			required = 50,
			reward = {
				{ 'Dirt', type = 'Trade' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Clay Ball', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Long Grass', type = 'Trade' },
				{ 'Enchanted Seeds', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Fern', type = 'Trade' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Dead Bush', type = 'Trade' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Double Tallgrass', type = 'Trade' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Box of Seeds', type = 'Recipe' },
			},
		},
	},
	['Slimeball'] = {
		minion = 'Slime',
		[1] = {
			required = 50,
			reward = {
				{ 'Slime Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Slime Hat', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Knockback}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Knockback &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Knockback Potion', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{ 'Enchanted Slimeball', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Punch}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Punch &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Launch Pad', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Enchanted Slime Block', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Slime Bow', type = 'Recipe' },
			},
		},
	},
	['Spider Eye'] = {
		minion = 'Cave Spider',
		[1] = {
			required = 50,
			reward = {
				{ 'Cave Spider Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Spider Sword', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Spider Hat', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted Spider Eye', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Bane of Arthropods}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Bane of Arthropods &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Venomous}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Venomous &7Exp Discount &a(-25%)',
				},
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Enchanted Fermented Spider Eye', type = 'Recipe' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 25000, type = 'Combat Experience' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Leaping Sword', type = 'Recipe' },
			},
		},
	},
	['Sponge'] = {
		minion = 'Fishing',
		[1] = {
			required = 20,
			reward = {
				{ 'Sponge', type = 'Trade' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Sponge Sinker', type = 'Recipe' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Sea Creature Talisman', type = 'Recipe' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Enchanted Sponge', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Sponge Belt', type = 'Recipe' },
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{ 'Sea Creature Ring', type = 'Recipe' },
			},
		},
		[7] = {
			required = 1500,
			reward = {
				{ 'Enchanted Wet Sponge', type = 'Recipe' },
				{ 'Stereo Pants', type = 'Recipe' },
			},
		},
		[8] = {
			required = 2000,
			reward = {
				{ 'Sea Creature Artifact', type = 'Recipe' },
			},
		},
		[9] = {
			required = 4000,
			reward = {
				{ 'Sponge Armor', type = 'Recipe' },
			},
		},
	},
	['Spruce Log'] = {
		minion = 'Spruce',
		[1] = {
			required = 50,
			reward = {
				{ 'Spruce Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Spruce Axe', type = 'Recipe' },
				{ 'Spruce Leaves', type = 'Trade' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Enchanted Spruce Log', type = 'Recipe' },
				{ 'Portal to Spruce Woods', type = 'Recipe' },
				{ 'Wolf Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 500, type = 'Foraging Experience' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Taiga Biome Stick', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2000,
			reward = {
				{ 2000, type = 'Foraging Experience' },
			},
		},
		[7] = {
			required = 5000,
			reward = {
				{ 'Woodcutting Crystal', type = 'Recipe' },
			},
		},
		[8] = {
			required = 10000,
			reward = {
				{ 10000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 25000, type = 'Foraging Experience' },
			},
		},
	},
	['String'] = {
		minion = 'Spider',
		[1] = {
			required = 50,
			reward = {
				{ 'Spider Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Web', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{ 'Quiver', type = 'Upgrade' },
				{ 'Spider Pet', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Enchanted String', type = 'Recipe' },
				{ 'Grappling Hook', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2500,
			reward = {
				{
					'{{Blue|Silk Touch}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Silk Touch &7Exp Discount &a(-25%)',
				},
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{
					'{{Blue|Infinite Quiver}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Infinite Quiver &7Exp Discount &a(-25%)',
				},
				{ 9, type = 'Quiver Slot' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 20000, type = 'Combat Experience' },
			},
		},
		[8] = {
			required = 25000,
			reward = {
				{ 'Spider\'s Boots', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 9, type = 'Quiver Slot' },
			},
		},
	},
	['Sugar Cane'] = {
		minion = 'Sugar Cane',
		[1] = {
			required = 100,
			reward = {
				{ 'Sugar Cane Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 250,
			reward = {
				{ 'Speed Talisman', type = 'Recipe' },
			},
		},
		[3] = {
			required = 500,
			reward = {
				{ 'Enchanted Sugar', type = 'Recipe' },
			},
		},
		[4] = {
			required = 1000,
			reward = {
				{ 'Speedster Armor', type = 'Recipe' },
			},
		},
		[5] = {
			required = 2000,
			reward = {
				{ 'Speed Ring', type = 'Recipe' },
			},
		},
		[6] = {
			required = 5000,
			reward = {
				{ 'Enchanted Paper', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Magic For Pets In A Hurry', type = 'Recipe' },
			},
		},
		[8] = {
			required = 20000,
			reward = {
				{ 'Enchanted Sugar Cane', type = 'Recipe' },
			},
		},
		[9] = {
			required = 50000,
			reward = {
				{ 'Speed Artifact', type = 'Recipe' },
			},
		},
	},
	['Sulphur'] = {
		[1] = {
			required = 200,
			reward = {
				{ 'Match-Sticks', type = 'Recipe' },
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Sulphur', type = 'Recipe' },
			},
		},
		[3] = {
			required = 2500,
			reward = {
				{ 'Small Nether Sack', type = 'Recipe' },
			},
		},
		[4] = {
			required = 5000,
			reward = {
				{ 'Totem of Corruption', type = 'Recipe' },
			},
		},
		[5] = {
			required = 10000,
			reward = {
				{ 'Medium Nether Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 15000,
			reward = {
				{ 'Enchanted Sulphur Cube', type = 'Recipe' },
			},
		},
		[7] = {
			required = 25000,
			reward = {
				{ 'Sulphur Bow', type = 'Recipe' },
			},
		},
		[8] = {
			required = 50000,
			reward = {
				{ 'Large Nether Sack', type = 'Recipe' },
			},
		},
		[9] = {
			required = 100000,
			reward = {
				{ 'Implosion Belt', type = 'Recipe' },
			},
		},
	},
	['Sunflower'] = {
		minion = 'Sunflower',
		[1] = {
			required = 1000,
			reward = {
				{ 'Enchanted Sunflower', type = 'Recipe' },
			},
		},
		[2] = {
			required = 5000,
			reward = {
				{ 'Sunflower Head', type = 'Recipe' },
				{ 'Sunflower Minion', type = 'Recipe' },
			},
		},
		[3] = {
			required = 10000,
			reward = {
				{ 'Dayswitch', type = 'Recipe' },
			},
		},
		[4] = {
			required = 25000,
			reward = {
				{ 'Compacted Sunflower', type = 'Recipe' },
			},
		},
		[5] = {
			required = 100000,
			reward = {
				{ 'Sunflower Oil', type = 'Recipe' },
			},
		},
		[6] = {
			required = 250000,
			reward = {
				{ 'Sunstone', type = 'Recipe' },
			},
		},
		[7] = {
			required = 500000,
			reward = {
				{ 'Sundial', type = 'Recipe' },
			},
		},
		[8] = {
			required = 1000000,
			reward = {
				{ 'Sunshine Crystal', type = 'Recipe' },
			},
		},
	},
	['Tender Wood'] = {
		[1] = {
			required = 10,
			reward = {
				{ 'Small Huntrap', type = 'Recipe' },
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Small Fish Bowl', type = 'Recipe' },
			},
		},
		[3] = {
			required = 50,
			reward = {
				{ 'Medium Huntrap', type = 'Recipe' },
			},
		},
		[4] = {
			required = 100,
			reward = {
				{ 'Enchanted Tender Wood', type = 'Recipe' },
				{ 'Medium Fish Bowl', type = 'Recipe' },
			},
		},
		[5] = {
			required = 200,
			reward = {
				{ 'Large Huntrap', type = 'Recipe' },
			},
		},
		[6] = {
			required = 400,
			reward = {
				{ 'Large Fish Bowl', type = 'Recipe' },
			},
		},
		[7] = {
			required = 600,
			reward = {
				{ 'Greater Huntrap', type = 'Recipe' },
			},
		},
		[8] = {
			required = 800,
			reward = {
				{ 50000, type = 'Hunting Experience' },
				{ 50000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 1000,
			reward = {
				{ 'Astral Huntrap', type = 'Recipe' },
			},
		},
	},
	['The Professor'] = {
		collectionType = 'Boss',
		collectionImage = 'The Professor Head',
		[1] = {
			required = 25,
			reward = {
				{'Suspicious Vial', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 50,
			reward = {
				{'Adaptive Leggings', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 100,
			reward = {
				{'Golden Professor Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 150,
			reward = {
				{'Adaptive Chestplate', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{'Diamond Professor Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Thorn'] = {
		collectionType = 'Boss',
		collectionImage = 'Thorn Head',
		[1] = {
			required = 50,
			reward = {
				{'Spirit Stone', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[2] = {
			required = 100,
			reward = {
				{'Golden Thorn Head', type = 'Reward'},
				{'Gold', type = 'Essence'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[3] = {
			required = 150,
			reward = {
				{'Spirit Shortbow', type = 'Reward'},
				{'15', type = 'SkyBlock Experience'},
			},
		},
		[4] = {
			required = 250,
			reward = {
				{'Recombobulator 3000', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[5] = {
			required = 400,
			reward = {
				{'Spirit Boots', type = 'Reward'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
		[6] = {
			required = 1000,
			reward = {
				{'Diamond Thorn Head', type = 'Recipe'},
				{'Diamond', type = 'Essence'},
				{'25', type = 'SkyBlock Experience'},
			},
		},
	},
	['Timite'] = {
		[1] = {
			required = 25,
			reward = {
				{ 'Time Gun', type = 'Recipe' },
				{ 'Eon Pickaxe', type = 'Recipe' },
			},
		},
		[2] = {
			required = 50,
			reward = {
				{ 'Time Pocket Bag', type = 'Upgrade' },
			},
		},
		[3] = {
			required = 100,
			reward = {
				{ 'Chrono Pickaxe', type = 'Recipe' },
			},
		},
		[4] = {
			required = 250,
			reward = {
				{ 'Highlite', type = 'Recipe' },
			},
		},
		[5] = {
			required = 500,
			reward = {
				{ 'Satelite', type = 'Recipe' },
			},
		},
		[6] = {
			required = 750,
			reward = {
				{ 'Discrite', type = 'Recipe' },
			},
		},
	},
	['Tropical Fish'] = {
		minion = 'Fishing',
		[1] = {
			required = 10,
			reward = {
				{ 'Tropical Fish Hat', type = 'Recipe' },
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Water Bucket', type = 'Trade' },
			},
		},
		[3] = {
			required = 50,
			reward = {
				{
					'{{Blue|Magnet}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Magnet &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 100,
			reward = {
				{ 'Small Sack of Sacks', type = 'Upgrade' },
				{ 'Enchanted Tropical Fish', type = 'Recipe' },
			},
		},
		[5] = {
			required = 200,
			reward = {
				{ 4, type = 'Small Sack of Sacks Slot' }, -- 'Small is shown in-game, I think it's a bug
			},
		},
		[6] = {
			required = 400,
			reward = {
				{ 4, type = 'Small Sack of Sacks Slot' },
			},
		},
		[7] = {
			required = 800,
			reward = {
				{ 'Tropical Cloak', type = 'Recipe' },
				{ 4, type = 'Small Sack of Sacks Slot' },
			},
		},
		[8] = {
			required = 1600,
			reward = {
				{ 4, type = 'Small Sack of Sacks Slot' },
			},
		},
		[9] = {
			required = 4000,
			reward = {
				{ 5, type = 'Small Sack of Sacks Slot' },
			},
		},
	},
	['Tungsten'] = {
		[1] = {
			required = 100,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Tungsten', type = 'Recipe' },
			},
		},
		[3] = {
			required = 5000,
			reward = {
				{ 'Refined Tungsten', type = 'Dwarven Forge Recipe' },
			},
		},
		[4] = {
			required = 10000,
			reward = {
				{ 'Tungsten Key', type = 'Dwarven Forge Recipe' },
			},
		},
		[5] = {
			required = 25000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[6] = {
			required = 50000,
			reward = {
				{ 'Tungsten Plate', type = 'Dwarven Forge Recipe' },
			},
		},
		[7] = {
			required = 100000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[8] = {
			required = 250000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[9] = {
			required = 500000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
	},
	['Umber'] = {
		[1] = {
			required = 100,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[2] = {
			required = 1000,
			reward = {
				{ 'Enchanted Umber', type = 'Recipe' },
			},
		},
		[3] = {
			required = 5000,
			reward = {
				{ 'Refined Umber', type = 'Dwarven Forge Recipe' },
			},
		},
		[4] = {
			required = 10000,
			reward = {
				{ 'Umber Key', type = 'Dwarven Forge Recipe' },
			},
		},
		[5] = {
			required = 25000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[6] = {
			required = 50000,
			reward = {
				{ 'Umber Plate', type = 'Dwarven Forge Recipe' },
			},
		},
		[7] = {
			required = 100000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[8] = {
			required = 250000,
			reward = {
				{
					'{{stat|mnf|+1}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&6+1☘ Mining Fortune',
				},
			},
		},
		[9] = {
			required = 500000,
			reward = {
				{ 'Umberella', type = 'Recipe' },
			},
		},
	},
	['Vinesap'] = {
		[1] = {
			required = 10,
			reward = {
				{ 'Worn Huntaxe - Genesis', type = 'Recipe' },
				{ 'Abysmal Lasso', type = 'Recipe' },
			},
		},
		[2] = {
			required = 25,
			reward = {
				{ 'Vinerip Lasso', type = 'Recipe' },
			},
		},
		[3] = {
			required = 50,
			reward = {
				{ 'Sharpened Huntaxe - Dominus', type = 'Recipe' },
			},
		},
		[4] = {
			required = 100,
			reward = {
				{ 'Enchanted Vinesap', type = 'Recipe' },
				{ 'Entangler Lasso', type = 'Recipe' },
			},
		},
		[5] = {
			required = 200,
			reward = {
				{ 'Reinforced Huntaxe - Cursus', type = 'Recipe' },
			},
		},
		[6] = {
			required = 400,
			reward = {
				{ 'Everstretch Lasso', type = 'Recipe' },
			},
		},
		[7] = {
			required = 600,
			reward = {
				{ 'Savage Huntaxe - Praedator', type = 'Recipe' },
			},
		},
		[8] = {
			required = 800,
			reward = {
				{ 50000, type = 'Hunting Experience' },
				{ 50000, type = 'Foraging Experience' },
			},
		},
		[9] = {
			required = 1000,
			reward = {
				{ 'Prime Huntaxe - Nex Titanum', type = 'Recipe' },
			},
		},
	},
	['Wheat'] = {
		minion = 'Wheat',
		[1] = {
			required = 50,
			reward = {
				{ 'Wheat Minion', type = 'Recipe' },
			},
		},
		[2] = {
			required = 100,
			reward = {
				{ 'Farmhand Armor', type = 'Recipe' },
				{ 'Beginner Agronomy Sack', type = 'Recipe' },
			},
		},
		[3] = {
			required = 250,
			reward = {
				{
					'{{Blue|Harvesting}} Exp Discount {{Green|(-25%)}}',
					type = 'Custom',
					nolink = true,
					rewardstr = '&9Harvesting &7Exp Discount &a(-25%)',
				},
			},
		},
		[4] = {
			required = 500,
			reward = {
				{ 'Enchanted Wheat', type = 'Recipe' },
			},
		},
		[5] = {
			required = 1000,
			reward = {
				{ 'Enchanted Bread', type = 'Recipe' },
				{ 'Small Agronomy Sack', type = 'Recipe' },
			},
		},
		[6] = {
			required = 2500,
			reward = {
				{ 'Farming Island', type = 'Recipe' },
				{ 'Haymaker Armor', type = 'Recipe' },
			},
		},
		[7] = {
			required = 10000,
			reward = {
				{ 'Farming Talisman', type = 'Recipe' },
			},
		},
		[8] = {
			required = 15000,
			reward = {
				{ 'Medium Agronomy Sack', type = 'Recipe' },
			},
		},
		[9] = {
			required = 25000,
			reward = {
				{ 25000, type = 'Farming Experience' },
			},
		},
		[10] = {
			required = 50000,
			reward = {
				{ 'Large Agronomy Sack', type = 'Recipe' },
			},
		},
		[11] = {
			required = 100000,
			reward = {
				{ 'Enchanted Hay Bale', type = 'Recipe' },
				{ 'Large Enchanted Agronomy Sack', type = 'Recipe' },
			},
		},
	},
	['Wild Rose'] = {
		[1] = {
			required = 1000,
			reward = {
				{ 'Enchanted Wild Rose', type = 'Recipe' },
			},
		},
		[2] = {
			required = 5000,
			reward = {
				{ 'Thorny Vines', type = 'Recipe' },
			},
		},
		[3] = {
			required = 10000,
			reward = {
				{ 'Plot Eraser', type = 'Recipe' },
			},
		},
		[4] = {
			required = 25000,
			reward = {
				{ 'Compacted Wild Rose', type = 'Recipe' },
			},
		},
		[5] = {
			required = 100000,
			reward = {
				{ 50000, type = 'Farming Experience' },
			},
		},
		[6] = {
			required = 250000,
			reward = {
				{ 'Rosewater Flask', type = 'Recipe' },
			},
		},
		[7] = {
			required = 500000,
			reward = {
				{ 'Bachelor\'s Rose', type = 'Recipe' },
			},
		},
		[8] = {
			required = 1000000,
			reward = {
				{ 'Prickly Kiss', type = 'Recipe' },
			},
		},
	},
	['Wilted Berberis'] = {
		[1] = {
			required = 20,
			reward = {
				{ 'Wilted Berberis Bunch', type = 'Recipe' },
			},
		},
		[2] = {
			required = 60,
			reward = {
				{ 'Berberis Blowgun', type = 'Recipe' },
			},
		},
		[3] = {
			required = 140,
			reward = {
				{ 'Jinxed Voodoo Doll', type = 'Recipe' },
			},
		},
		[4] = {
			required = 400,
			reward = {
				{ 'Berberis Fuel Injector', type = 'Recipe' },
			},
		},
	},
}
-- Adding skyblock experience
for _, data in pairs(all_collections) do
	for _, tier in ipairs(data) do -- use ipair - we want only the indexed ones
		if tier.reward and tier.reward[#tier.reward].type ~= 'SkyBlock Experience' then tier.reward[#tier.reward + 1] = { '4', type = 'SkyBlock Experience' } end
	end
end

-- for debug
-- local p = { main = function() return all_collections end }
-- return p

-- actual usage
return all_collections