local slots = {
	-- Normal Slots
	['ruby'] = {
		icon = "&#xE010;",
		-- fallbackIcon = "❤",,
		color = "#F55",
		colorClass = "red",
		ttColor = "&c",
		slotName = "Ruby"
	},
	['amethyst'] = {
		icon = "&#xE008;",
		-- fallbackIcon = "❈",,
		color = "#A0A",
		colorClass = "dark_purple",
		ttColor = "&5",
		slotName = "Amethyst"
	},
	['jade'] = {
		icon = "&#xE053;",
		-- fallbackIcon = "☘",,
		color = "#5F5",
		colorClass = "green",
		ttColor = "&a",
		slotName = "Jade"
	},
	['sapphire'] = {
		icon = "&#xE003;",
		-- fallbackIcon = "✎",,
		color = "#5FF",
		colorClass = "aqua",
		ttColor = "&b",
		slotName = "Sapphire"
	},
	['amber'] = {
		icon = "&#xE015;",
		-- fallbackIcon = "⸕",,
		color = "#FA0",
		colorClass = "gold",
		ttColor = "&6",
		slotName = "Amber"
	},
	['topaz'] = {
		icon = "&#xE01C;",
		-- fallbackIcon = "✧",,
		color = "#FF5",
		colorClass = "yellow",
		ttColor = "&e",
		slotName = "Topaz"
	},
	['jasper'] = {
		icon = "&#xE00D;",
		-- fallbackIcon = "❁",,
		color = "#F5F",
		colorClass = "light_purple",
		ttColor = "&d",
		slotName = "Jasper"
	},
	['opal'] = {
		icon = "&#xE027;",
		-- fallbackIcon = "❂",,
		color = "#F5F",
		colorClass = "white",
		ttColor = "&f",
		slotName = "Opal"
	},
	['onyx'] = {
		icon = "&#xE007;",
		-- fallbackIcon = "☠",,
		color = "#555",
		colorClass = "dark_gray",
		ttColor = "&8",
		slotName = "Onyx"
	},
	['aquamarine'] = {
		icon = "&#xE00C;",
		-- fallbackIcon = "☂",,
		color = "#00A",
		colorClass = "dark_aqua",
		ttColor = "&3",
		slotName = "Aquamarine"
	},
	['citrine'] = {
		icon = "&#xE054;",
		-- fallbackIcon = "☘",,
		color = "#A00",
		colorClass = "dark_red",
		ttColor = "&4",
		slotName = "Citrine"
	},
	['peridot'] = {
		icon = "&#xE051;",
		-- fallbackIcon = "☘",,
		color = "#0A0",
		colorClass = "dark_green",
		ttColor = "&2",
		slotName = "Peridot"
	},
	
	-- Special Slots
	['combat'] = {
		icon = "⚔",
		color = "#A00",
		colorClass = "dark_red",
		ttColor = "&4",
		slotName = "Combat",
		applicable = "&cRuby&r/&5Amethyst&r/&bSapphire&r/&dJasper&r/&8Onyx&r/&fOpal&r"
	},
	['defensive'] = {
		icon = "☤",
		color = "#5F5",
		colorClass = "green",
		ttColor = "&a",
		slotName = "Defensive",
		applicable = "&cRuby&r/&5Amethyst&r/&fOpal&r"
	},
	['mining'] = {
		icon = "✦",
		color = "#A0A",
		colorClass = "dark_purple",
		ttColor = "&5",
		slotName = "Mining",
		applicable = "&aJade&r/&6Amber&r/&eTopaz&r"
	},
	['chisel'] = {
		icon = "❥",
		color = "#FA0",
		colorClass = "gold",
		ttColor = "&6",
		slotName = "Chisel",
		applicable = "&4Citrine&r/&9Aquamarine&r/&8Onyx&r/&2Peridot&r"
	},
	['universal'] = {
		icon = "❂",
		color = "white",
		colorClass = "white",
		ttColor = "&f",
		slotName = "Universal",
		applicable = "&aAny&r"
	},
}
-- note: these should match the slot names above
local names = {
	'ruby',
	'amethyst',
	'jade',
	'sapphire',
	'amber',
	'topaz',
	'jasper',
	'opal',
	'onyx',
	'aquamarine',
	'citrine',
	'peridot',
}

local tiers = {
	rough = { color = 'white', order = 1, },
	flawed = { color = 'green', order = 2, },
	fine = { color = 'blue', order = 3, },
	flawless = { color = 'dark_purple', order = 4, },
	perfect = { color = 'gold', order = 5, },
}

return {
	slots = slots,
	names = names,
	tiers = tiers,
}