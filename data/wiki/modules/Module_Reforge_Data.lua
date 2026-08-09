--<pre>
-- For source, it's either Basic (obtainable without a reforge stone or the like) or the name of the reforge stone which is needed to apply it.
-- Don't include description or effect if there is none.
-- Don't include cost if the reforge is not from a reforge stone.
--[[Quick Copy
	[''] = {
		stats = {
			c = {be
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
			u = {
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
			r = {
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
			e = {
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
			l = {
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
			m = {
				bas = ,
				cc = ,
				cd = ,
				def = ,
				dmg = ,
				fmf = ,
				fer = ,
				frf = ,
				hp = ,
				int = ,
				mf = ,
				mnf = ,
				mns = ,
				scc = ,
				spd = ,
				str = ,
			},
		},
		source = '',
		description = '',
		costs = {c = , u = , r = , e = , l = , m =  },
		effect = '', (CURRENTLY NOT FUNCTIONAL)
	},
--]]
return {
	['Armor'] = {
		['Geometric'] = {
			stats = {
				c = {},
				u = {
					fs = 1,
					tfc = 1,
				},
				r = {
					fs = 1.5,
					tfc = 1.5,
				},
				e = {
					fs = 2,
					tfc = 2,
				},
				l = {
					fs = 3,
					tfc = 3,
				},
				m = {
					fs = 4,
					tfc = 4,
				},
			},
			source = 'Geometric Oddity',
			description = '&9Geometric Bonus/&7Gain a &a+5% &7chance to catch a bonus/&6Trophy &7while fishing in a &dWormhole&7.',
			costs = {u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Calcified'] = {
			stats = {
				c = {
					fs = 0.5,
					def = 3,
				},
				u = {
					fs = 1,
					def = 5,
				},
				r = {
					fs = 1.5,
					def = 7,
				},
				e = {
					fs = 2.5,
					def = 10,
				},
				l = {
					fs = 3.5,
					def = 13,
				},
				m = {
					fs = 4.5,
					def = 16,
				},
				d = {
					fs = 4.5,
					def = 16,
				},
			},
			source = 'Calcified Heart',
			description = '&9Calcified Bonus/&7Grants &a+25 Defense &7against &3Sea/&3Creatures&7.',			
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000, d = 800000 },
		},
		['Clean'] = {
			stats = {
				c = {
					cc = 2,
					def = 5,
					hp = 5,
				},
				u = {
					cc = 4,
					def = 7,
					hp = 7,
				},
				r = {
					cc = 6,
					def = 10,
					hp = 10,
				},
				e = {
					cc = 8,
					def = 15,
					hp = 15,
				},
				l = {
					cc = 10,
					def = 20,
					hp = 20,
				},
				m = {
					cc = 12,
					def = 25,
					hp = 25,
				},
			},
			source = 'Basic',
		},
		['Fierce'] = {
			stats = {
				c = {
					cc = 2,
					cd = 4,
					str = 2,
				},
				u = {
					cc = 3,
					cd = 7,
					str = 4,
				},
				r = {
					cc = 4,
					cd = 10,
					str = 6,
				},
				e = {
					cc = 5,
					cd = 14,
					str = 8,
				},
				l = {
					cc = 6,
					cd = 18,
					str = 10,
				},
				m = {
					cc = 8,
					cd = 24,
					str = 12,
				},
			},
			source = 'Basic',
		},
		['Heavy'] = {
			stats = {
				c = {
					cd = -1,
					def = 25,
					spd = -1,
				},
				u = {
					cd = -2,
					def = 35,
					spd = -1,
				},
				r = {
					cd = -2,
					def = 50,
					spd = -1,
				},
				e = {
					cd = -3,
					def = 65,
					spd = -1,
				},
				l = {
					cd = -5,
					def = 80,
					spd = -1,
				},
				m = {
					cd = -7,
					def = 110,
					spd = -1,
				},
			},
			source = 'Basic',
		},
		['Light'] = {
			stats = {
				c = {
					bas = 1,
					cc = 1,
					cd = 1,
					def = 1,
					hp = 5,
					spd = 1,
				},
				u = {
					bas = 2,
					cc = 1,
					cd = 2,
					def = 2,
					hp = 7,
					spd = 2,
				},
				r = {
					bas = 3,
					cc = 2,
					cd = 3,
					def = 3,
					hp = 10,
					spd = 3,
				},
				e = {
					bas = 4,
					cc = 2,
					cd = 4,
					def = 4,
					hp = 15,
					spd = 4,
				},
				l = {
					bas = 5,
					cc = 3,
					cd = 5,
					def = 5,
					hp = 20,
					spd = 5,
				},
				m = {
					bas = 6,
					cc = 3,
					cd = 6,
					def = 6,
					hp = 25,
					spd = 6,
				},
			},
			source = 'Basic',
		},
	['Mantid'] = {
			stats = {
				c = {
					bpc = 0.5,
					fmf = 2,
				},
				u = {
					bpc = 0.5,
					fmf = 4,
				},
				r = {
					bpc = 1, 
					fmf = 6,
				},
				e = {
					bpc = 1.5,
					fmf = 8,
				},
				l = {
					bpc = 2,
					fmf = 10,
				},
				m = {
					bpc = 2.5,
					fmf = 12,
				},
			},
			source = 'Mantid Claw',
			description = '&9Mantid Bonus/&7Grants &2+0.25 Bonus Pest Chance/&7per &2 Pest &7killed for &a10 minutes&7./&7Caps at &25 Bonus Pest Chance.',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 150000 },
		},
		['Mythic'] = {
			stats = {
				c = {
					cc = 1,
					def = 2,
					hp = 2,
					int = 20,
					spd = 2,
					str = 2,
				},
				u = {
					cc = 2,
					def = 4,
					hp = 4,
					int = 25,
					spd = 2,
					str = 4,
				},
				r = {
					cc = 3,
					def = 6,
					hp = 6,
					int = 30,
					spd = 2,
					str = 6,
				},
				e = {
					cc = 4,
					def = 8,
					hp = 8,
					int = 40,
					spd = 2,
					str = 8,
				},
				l = {
					cc = 5,
					def = 10,
					hp = 10,
					int = 50,
					spd = 2,
					str = 10,
				},
				m = {
					cc = 6,
					def = 12,
					hp = 12,
					int = 60,
					spd = 2,
					str = 12,
				},
			},
			source = 'Basic',
		},
		['Pure'] = {
			stats = {
				c = {
					bas = 1,
					cc = 2,
					cd = 2,
					def = 2,
					hp = 2,
					int = 1,
					spd = 2,
					str = 2,
				},
				u = {
					bas = 1,
					cc = 4,
					cd = 3,
					def = 3,
					hp = 3,
					int = 3,
					spd = 1,
					str = 3,
				},
				r = {
					bas = 2,
					cc = 6,
					cd = 4,
					def = 4,
					hp = 4,
					int = 4,
					spd = 1,
					str = 4,
				},
				e = {
					bas = 3,
					cc = 8,
					cd = 6,
					def = 6,
					hp = 6,
					int = 6,
					spd = 1,
					str = 6,
				},
				l = {
					bas = 4,
					cc = 10,
					cd = 8,
					def = 8,
					hp = 8,
					int = 8,
					spd = 1,
					str = 8,
				},
				m = {
					bas = 5,
					cc = 12,
					cd = 8,
					def = 10,
					hp = 10,
					int = 10,
					spd = 1,
					str = 10,
				},
			},
			source = 'Basic',
		},
		['Smart'] = {
			stats = {
				c = {
					def = 4,
					hp = 4,
					int = 20,
				},
				u = {
					def = 6,
					hp = 6,
					int = 40,
				},
				r = {
					def = 9,
					hp = 9,
					int = 60,
				},
				e = {
					def = 12,
					hp = 12,
					int = 80,
				},
				l = {
					def = 15,
					hp = 15,
					int = 100,
				},
				m = {
					def = 20,
					hp = 20,
					int = 120,
				},
			},
			source = 'Basic',
		},
		['Sunny'] = {
			stats = {
				c = {
					spd = 2,
					fmw = 1,
				},
				u = {
					spd = 3,
					fmw = 2,
				},
				r = {
					spd = 4,
					fmw = 3,
				},
				e = {
					spd = 6,
					fmw = 4,
				},
				l = {
					spd = 8,
					fmw = 5,
				},
				m = {
					spd = 10,
					fmw = 6,
				},
			},
			source = 'Sunstone',
			costs = {c = 2000, u = 10000, r = 20000, e = 50000, l = 100000, m = 200000 },
		},
		['Titanic'] = {
			stats = {
				c = {
					def = 10,
					hp = 10,
				},
				u = {
					def = 15,
					hp = 15,
				},
				r = {
					def = 20,
					hp = 20,
				},
				e = {
					def = 25,
					hp = 25,
				},
				l = {
					def = 35,
					hp = 35,
				},
				m = {
					def = 50,
					hp = 50,
				},
			},
			source = 'Basic',
		},
		['Wise'] = {
			stats = {
				c = {
					hp = 4,
					int = 25,
					spd = 1,
				},
				u = {
					hp = 6,
					int = 50,
					spd = 1,
				},
				r = {
					hp = 9,
					int = 75,
					spd = 1,
				},
				e = {
					hp = 12,
					int = 100,
					spd = 2,
				},
				l = {
					hp = 15,
					int = 125,
					spd = 2,
				},
				m = {
					hp = 20,
					int = 150,
					spd = 3,
				},
			},
			source = 'Basic',
		},
		['Perfect'] = {
			stats = {
				c = {
					def = 25,
				},
				u = {
					def = 35,
				},
				r = {
					def = 50,
				},
				e = {
					def = 65,
				},
				l = {
					def = 80,
				},
				m = {
					def = 110,
				},
			},
			source = 'Diamond Atom',
			description = '&9Perfect Bonus/&7Increases &a Defense &7by &a+2%&7.',
			-- effect = 'total_defense = total_defense * 1.02',
			costs = {c = 30000, u = 75000, r = 150000, e = 300000, l = 600000, m = 1200000 },
		},
		['Necrotic'] = {
			stats = {
				c = {
					int = 30,
				},
				u = {
					int = 60,
				},
				r = {
					int = 90,
				},
				e = {
					int = 120,
				},
				l = {
					int = 150,
				},
				m = {
					int = 200,
				},
			},
			source = 'Necromancer\'s Brooch',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Ancient'] = {
			stats = {
				c = {
					cc = 3,
					def = 7,
					hp = 7,
					int = 6,
					str = 4,
				},
				u = {
					cc = 5,
					def = 7,
					hp = 7,
					int = 9,
					str = 8,
				},
				r = {
					cc = 7,
					def = 7,
					hp = 7,
					int = 12,
					str = 12,
				},
				e = {
					cc = 9,
					def = 7,
					hp = 7,
					int = 16,
					str = 18,
				},
				l = {
					cc = 12,
					def = 7,
					hp = 7,
					int = 20,
					str = 25,
				},
				m = {
					cc = 15,
					def = 7,
					hp = 7,
					int = 25,
					str = 35,
				},
			},
			source = 'Precursor Gear',
			description = '&9Ancient Bonus/&7Grants &a+1 &9 Crit Damage &7per/&cCatacombs &7level.',
			costs = {c = 10000, u = 20000, r = 30000, e = 40000, l = 50000, m = 60000 },
			-- effect = 'total_crit_damage = total_crit_damage + catacombs_level',
		},
		['Spiked'] = {
			stats = {
				c = {
					bas = 1,
					cc = 2,
					cd = 3,
					def = 2,
					hp = 2,
					int = 3,
					spd = 1,
					str = 3,
				},
				u = {
					bas = 1,
					cc = 4,
					cd = 4,
					def = 3,
					hp = 3,
					int = 4,
					spd = 1,
					str = 4,
				},
				r = {
					bas = 2,
					cc = 6,
					cd = 6,
					def = 4,
					hp = 4,
					int = 6,
					spd = 1,
					str = 6,
				},
				e = {
					bas = 3,
					cc = 8,
					cd = 8,
					def = 6,
					hp = 6,
					int = 8,
					spd = 1,
					str = 8,
				},
				l = {
					bas = 4,
					cc = 10,
					cd = 10,
					def = 8,
					hp = 8,
					int = 10,
					spd = 1,
					str = 10,
				},
				m = {
					bas = 5,
					cc = 12,
					cd = 12,
					def = 10,
					hp = 10,
					int = 12,
					spd = 1,
					str = 12,
				},
			},
			source = 'Dragon Scale',
			costs = {c = 30000, u = 75000, r = 150000, e = 300000, l = 600000, m = 1200000 },
		},
		['Renowned'] = {
			stats = {
				c = {
					bas = 1,
					cc = 2,
					cd = 3,
					def = 2,
					hp = 2,
					int = 3,
					spd = 1,
					str = 3,
				},
				u = {
					bas = 1,
					cc = 4,
					cd = 4,
					def = 3,
					hp = 3,
					int = 4,
					spd = 1,
					str = 4,
				},
				r = {
					bas = 2,
					cc = 6,
					cd = 6,
					def = 4,
					hp = 4,
					int = 6,
					spd = 1,
					str = 6,
				},
				e = {
					bas = 3,
					cc = 8,
					cd = 8,
					def = 6,
					hp = 6,
					int = 8,
					spd = 1,
					str = 8,
				},
				l = {
					bas = 4,
					cc = 10,
					cd = 10,
					def = 8,
					hp = 8,
					int = 10,
					spd = 1,
					str = 10,
				},
				m = {
					bas = 5,
					cc = 12,
					cd = 12,
					def = 10,
					hp = 10,
					int = 12,
					spd = 1,
					str = 12,
				},
			},
			source = 'Dragon Horn',
			description = '&9Renowned Bonus/&7Increases all &cCombat &7stats and &b Magic Find &7by &a+1%&7.',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
			-- effect = 'total_bas = total_bas * 1.01, total_cc = total_cc * 1.01, total_cd = total_cd * 1.01, total_def = total_def * 1.01, total_fer = total_fer * 1.01, total_hp = total_hp * 1.01, total_int = total_int * 1.01, total_mf = total_mf * 1.01, total_scc = total_scc * 1.01, total_spd = total_spd * 1.01, total_str = total_str * 1.01s',
		},
		['Cubic'] = {
			stats = {
				c = {
					hp = 5,
					str = 3,
				},
				u = {
					hp = 7,
					str = 5,
				},
				r = {
					hp = 10,
					str = 7,
				},
				e = {
					hp = 15,
					str = 10,
				},
				l = {
					hp = 20,
					str = 12,
				},
				m = {
					hp = 25,
					str = 15,
				},
			},
			source = 'Molten Cube',
			description = '&9Cubic Bonus/&7Decreases damage taken from/&7Nether mobs by &a2%&7.',
			costs = {c = 4000, u = 7500, r = 15000, e = 40000, l = 75000, m = 150000 },
		},
		['Hyper'] = {
			stats = {
				c = {
					bas = 2,
					spd = 1,
					str = 2,
					extraspeed = 1,
				},
				u = {
					bas = 3,
					spd = 1,
					str = 4,
					extraspeed = 2,
				},
				r = {
					bas = 4,
					spd = 2,
					str = 6,
					extraspeed = 3,
				},
				e = {
					bas = 5,
					spd = 2,
					str = 7,
					extraspeed = 4,
				},
				l = {
					bas = 6,
					spd = 3,
					str = 10,
					extraspeed = 5,
				},
				m = {
					bas = 7,
					spd = 3,
					str = 12,
					extraspeed = 6,
				},
			},
			source = 'End Stone Geode',
			description = '&9Hyper Bonus/&7Gain &f+{1} Speed &7for &a5s &7after/&7teleporting.',
			substitution = {'extraspeed'},
			costs = {c = 5000, u = 10000, r = 20000, e = 50000, l = 100000, m = 200000 },
		},
		['Reinforced'] = {
			stats = {
				c = {
					def = 25,
				},
				u = {
					def = 35,
				},
				r = {
					def = 50,
				},
				e = {
					def = 65,
				},
				l = {
					def = 80,
				},
				m = {
					def = 110,
				},
			},
			source = 'Rare Diamond',
			costs = {c = 2500, u = 5000, r = 10000, e = 25000, l = 50000, m = 100000 },
		},
		['Loving'] = {
			stats = {
				c = {
					def = 4,
					hp = 4,
					int = 20,
				},
				u = {
					def = 5,
					hp = 5,
					int = 40,
				},
				r = {
					def = 6,
					hp = 6,
					int = 60,
				},
				e = {
					def = 7,
					hp = 8,
					int = 80,
				},
				l = {
					def = 10,
					hp = 10,
					int = 100,
				},
				m = {
					def = 14,
					hp = 14,
					int = 120,
				},
			},
			source = 'Red Scarf',
			description = '&9Loving Bonus/&7Increases ability damage by &a5%&7.',
			-- effect = 'ability_damage = ability_damage*1.05',
			costs = {c = 30000, u = 75000, r = 150000, e = 300000, l = 600000, m = 1200000 },
		},
		['Ridiculous'] = {
			stats = {
				c = {
					cc = 1,
					def = 10,
					hp = 10,
				},
				u = {
					cc = 2,
					def = 15,
					hp = 15,
				},
				r = {
					cc = 3,
					def = 20,
					hp = 20,
				},
				e = {
					cc = 4,
					def = 25,
					hp = 25,
				},
				l = {
					cc = 5,
					def = 35,
					hp = 35,
				},
				m = {
					cc = 6,
					def = 50,
					hp = 50,
				},
			},
			source = 'Red Nose',
			description = '&9Ridiculous Bonus/&7Fart when you sneak. Reduces your/&9 Crit Chance &7by &c20% &7for &a20s &7but/&7grants &a+30  Defense &7for &a5s &7and/&b+50 &7mana. Requires at least &c20% &9/&9Crit Chance &7to activate.',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000 },
		},
		['Giant'] = {
			stats = {
				c = {
					hp = 50,
				},
				u = {
					hp = 60,
				},
				r = {
					hp = 80,
				},
				e = {
					hp = 120,
				},
				l = {
					hp = 180,
				},
				m = {
					hp = 240,
				},
			},
			source = 'Giant Tooth',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Submerged'] = {
			stats = {
				c = {
					cc = 2,
					scc = 0.5,
					fs = 1,
				},
				u = {
					cc = 4,
					scc = 0.6,
					fs = 1,
				},
				r = {
					cc = 6,
					scc = 0.7,
					fs = 2,
				},
				e = {
					cc = 8,
					scc = 0.8,
					fs = 3,
				},
				l = {
					cc = 10,
					scc = 0.9,
					fs = 4,
				},
				m = {
					cc = 12,
					scc = 1,
					fs = 5,
				},
			},
			source = 'Deep Sea Orb',
			costs = {c = 50000, u = 150000, r = 350000, e = 600000, l = 750000, m = 800000 },
		},
		['Jaded'] = {
			stats = {
				c = {
					mnf = 5,
					mns = 5,
				},
				u = {
					mnf = 10,
					mns = 12,
				},
				r = {
					mnf = 15,
					mns = 20,
				},
				e = {
					mnf = 20,
					mns = 30,
				},
				l = {
					mnf = 25,
					mns = 45,
				},
				m = {
					mnf = 30,
					mns = 60,
				},
			},
			source = 'Jaderald',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Empowered'] = {
			stats = {
				c = {
					hp = 10,
					def = 10,
				},
				u = {
					hp = 15,
					def = 15,
				},
				r = {
					hp = 20,
					def = 20,
				},
				e = {
					hp = 25,
					def = 25,
				},
				l = {
					hp = 35,
					def = 35,
				},
				m = {
					hp = 50,
					def = 50,
				},
			},
			source = 'Sadan\'s Brooch',
			description = '&9Empowered Bonus/&7Grants &a+10 Mending &7while in/&7Dungeons, which increases your/&7healing on others.',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Candied'] = {
			stats = {
				c = {
					hp = 1,
					def = 1,
				},
				u = {
					hp = 2,
					def = 1,
				},
				r = {
					hp = 4,
					def = 2,
				},
				e = {
					hp = 6,
					def = 3,
				},
				l = {
					hp = 8,
					def = 4,
				},
				m = {
					hp = 10,
					def = 5,
				},
			},
			source = 'Candy Corn',
			description = '&9Candied Bonus/&7Increases the chance to find candy/&7during the &6Spooky Festival &7by &a+1%&7.',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Festive'] = {
			stats = {
				c = {
					fs = 2,
					int = 5,
					scc = 0.05,
				},
				u = {
					fs = 3,
					int = 10,
					scc = 0.05,
				},
				r = {
					fs = 4,
					int = 15,
					scc = 0.1,
				},
				e = {
					fs = 6,
					int = 20,
					scc = 0.15,
				},
				l = {
					fs = 8,
					int = 25,
					scc = 0.2,
				},
				m = {
					fs = 10,
					int = 30,
					scc = 0.25,
				},
			},
			source = 'Frozen Bauble',
			costs = {c = 25000, u = 75000, r = 150000, e = 250000, l = 400000, m = 600000 },
		},
		['Bustling'] = {
			stats = {
				c = {
					fmf = 1,
				},
				u = {
					fmf = 2,
				},
				r = {
					fmf = 4,
				},
				e = {
					fmf = 6,
				},
				l = {
					fmf = 8,
				},
				m = {
					fmf = 10,
				},
			},
			source = 'SkyMart Brochure',
			costs = {c = 1000, u = 2000, r = 3000, e = 6000, l = 10000, m = 15000 },
		},
		['Mossy'] = {
			stats = {
				c = {
					fmf = 5,
					spd = 3,
				},
				u = {
					fmf = 10,
					spd = 3,
				},
				r = {
					fmf = 15,
					spd = 5,
				},
				e = {
					fmf = 20,
					spd = 5,
				},
				l = {
					fmf = 25,
					spd = 7,
				},
				m = {
					fmf = 30,
					spd = 7,
				},
			},
			source = 'Overgrown Grass',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Undead'] = {
			stats = {
				c = {
					bas = 1,
					def = 6,
					hp = 8,
					str = 1,
				},
				u = {
					bas = 2,
					def = 8,
					hp = 8,
					str = 2,
				},
				r = {
					bas = 3,
					def = 12,
					hp = 12,
					str = 2,
				},
				e = {
					bas = 4,
					def = 18,
					hp = 18,
					str = 3,
				},
				l = {
					bas = 5,
					def = 25,
					hp = 25,
					str = 5,
				},
				m = {
					bas = 6,
					def = 33,
					hp = 33,
					str = 7,
				},
			},
			source = 'Premium Flesh',
			description = '&9Undead Bonus/&7Decreases damage taken from &2 Undead &7mobs by &a2%&7.',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000 },
		},
		['Dimensional'] = {
			stats = {
				c = {
					mw = 1,
					mns = 10,
				},
				u = {
					mw = 1,
					mns = 15,
				},
				r = {
					mw = 1,
					mns = 20,
				},
				e = {
					mw = 2,
					mns = 30,
				},
				l = {
					mw = 2,
					mns = 40,
				},
				m = {
					mw = 3,
					mns = 50,
				},
				d = {
					mw = 3,
					mns = 50,
				},
			},
			source = 'Titanium Tesseract',
			description = '&9Dimensional Bonus/&7&fTitanium Ore &7grants &2+10 Mithril/&2Powder &7when mined.',
			costs = {c = 15000, u = 30000, r = 60000, e = 80000, l = 100000, m = 100000, d = 100000},
		},
		['Groovy'] = {
			stats = {
				c = {
					forf = 2,
				},
				u = {
					forf = 3,
				},
				r = {
					forf = 4,
				},
				e = {
					forf = 5,
				},
				l = {
					forf = 6,
				},
				m = {
					forf = 7,
				},
				d = {
					forf = 7,
				},
			},
			source = 'Mangrove Gem',
			costs = {c = 10000, u = 15000, r = 20000, e = 30000, l = 40000, m = 50000, d = 50000},
		},
	},
	['Sword'] = {
		['Gentle'] = {
			stats = {
				c = {
					bas = 8,
					str = 3,
				},
				u = {
					bas = 10,
					str = 5,
				},
				r = {
					bas = 15,
					str = 7,
				},
				e = {
					bas = 20,
					str = 10,
				},
				l = {
					bas = 25,
					str = 15,
				},
				m = {
					bas = 30,
					str = 20,
				},
			},
			source = 'Basic',
		},
		['Odd'] = {
			stats = {
				c = {
					cc = 12,
					cd = 10,
					int = -5,
				},
				u = {
					cc = 15,
					cd = 15,
					int = -10,
				},
				r = {
					cc = 15,
					cd = 15,
					int = -18,
				},
				e = {
					cc = 20,
					cd = 22,
					int = -32,
				},
				l = {
					cc = 25,
					cd = 30,
					int = -50,
				},
				m = {
					cc = 30,
					cd = 40,
					int = -77,
				},
			},
			source = 'Basic',
		},
		['Fast'] = {
			stats = {
				c = {
					bas = 10,
				},
				u = {
					bas = 20,
				},
				r = {
					bas = 30,
				},
				e = {
					bas = 40,
				},
				l = {
					bas = 50,
				},
				m = {
					bas = 60,
				},
			},
			source = 'Basic',
		},
		['Fair'] = {
			stats = {
				c = {
					bas = 2,
					cc = 2,
					cd = 2,
					int = 2,
					str = 2,
				},
				u = {
					bas = 3,
					cc = 3,
					cd = 3,
					int = 3,
					str = 3,
				},
				r = {
					bas = 4,
					cc = 4,
					cd = 4,
					int = 4,
					str = 4,
				},
				e = {
					bas =7 ,
					cc = 7,
					cd = 7,
					int = 7,
					str = 7,
				},
				l = {
					bas = 10,
					cc = 10,
					cd = 10,
					int = 10,
					str = 10,
				},
				m = {
					bas = 12,
					cc = 12,
					cd = 12,
					int = 12,
					str = 12,
				},
			},
			source = 'Basic',
		},
		['Epic'] = {
			stats = {
				c = {
					bas = 1,
					cd = 10,
					str = 15,
				},
				u = {
					bas = 2,
					cd = 15,
					str = 20,
				},
				r = {
					bas = 4,
					cd = 20,
					str = 25,
				},
				e = {
					bas = 7,
					cd = 27,
					str = 32,
				},
				l = {
					bas = 10,
					cd = 35,
					str = 40,
				},
				m = {
					bas = 15,
					cd = 45,
					str = 50,
				},
			},
			source = 'Basic',
		},
		['Sharp'] = {
			stats = {
				c = {
					cc = 10,
					cd = 20,
				},
				u = {
					cc = 12,
					cd = 30,
				},
				r = {
					cc = 14,
					cd = 40,
				},
				e = {
					cc = 17,
					cd = 55,
				},
				l = {
					cc = 20,
					cd = 75,
				},
				m = {
					cc = 25,
					cd = 90,
				},
			},
			source = 'Basic',
		},
		['Heroic'] = {
			stats = {
				c = {
					bas = 1,
					int = 40,
					str = 15,
				},
				u = {
					bas = 2,
					int = 50,
					str = 20,
				},
				r = {
					bas = 2,
					int = 65,
					str = 25,
				},
				e = {
					bas = 3,
					int = 80,
					str = 32,
				},
				l = {
					bas = 5,
					int = 100,
					str = 40,
				},
				m = {
					bas = 7,
					int = 125,
					str = 50,
				},
			},
			source = 'Basic',
		},
		['Spicy'] = {
			stats = {
				c = {
					bas = 1,
					cc = 1,
					cd = 25,
					str = 2,
				},
				u = {
					bas = 2,
					cc = 1,
					cd = 35,
					str = 3,
				},
				r = {
					bas = 4,
					cc = 1,
					cd = 45,
					str = 4,
				},
				e = {
					bas = 7,
					cc = 1,
					cd = 60,
					str = 7,
				},
				l = {
					bas = 10,
					cc = 1,
					cd = 80,
					str = 10,
				},
				m = {
					bas = 15,
					cc = 1,
					cd = 100,
					str = 12,
				},
			},
			source = 'Basic',
		},
		['Legendary'] = {
			stats = {
				c = {
					bas = 2,
					cc = 5,
					cd = 5,
					int = 5,
					str = 3,
				},
				u = {
					bas = 3,
					cc = 7,
					cd = 10,
					int = 8,
					str = 7,
				},
				r = {
					bas = 5,
					cc = 9,
					cd = 15,
					int = 12,
					str = 12,
				},
				e = {
					bas = 7,
					cc = 12,
					cd = 22,
					int = 18,
					str = 18,
				},
				l = {
					bas = 10,
					cc = 15,
					cd = 28,
					int = 25,
					str = 25,
				},
				m = {
					bas = 15,
					cc = 18,
					cd = 36,
					int = 35,
					str = 32,
				},
			},
			source = 'Basic',
		},
		['Dirty'] = {
			stats = {
				c = {
					bas = 2,
					fer = 2,
					str = 2,
				},
				u = {
					bas = 3,
					fer = 3,
					str = 4,
				},
				r = {
					bas = 5,
					fer = 6,
					str = 6,
				},
				e = {
					bas = 10,
					fer = 9,
					str = 10,
				},
				l = {
					bas = 15,
					fer = 12,
					str = 12,
				},
				m = {
					bas = 20,
					fer = 15,
					str = 15,
				},
			},
			source = 'Dirt Bottle',
			costs = {c = 1000, u = 5000, r = 10000, e = 15000, l = 50000, m = 75000 },
		},
		['Fabled'] = {
			stats = {
				c = {
					cd = 15,
					str = 30,
				},
				u = {
					cd = 20,
					str = 35,
				},
				r = {
					cd = 25,
					str = 40,
				},
				e = {
					cd = 32,
					str = 50,
				},
				l = {
					cd = 40,
					str = 60,
				},
				m = {
					cd = 50,
					str = 75,
				},
			},
			source = 'Dragon Claw',
			description = '&9Fabled Bonus/&7Critical hits have a chance to deal/&7up to &a15% &7extra damage.',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Suspicious'] = {
			stats = {
				c = {
					cc = 1,
					cd = 30,
				},
				u = {
					cc = 2,
					cd = 40,
				},
				r = {
					cc = 3,
					cd = 50,
				},
				e = {
					cc = 5,
					cd = 65,
				},
				l = {
					cc = 7,
					cd = 85,
				},
				m = {
					cc = 10,
					cd = 110,
				},
			},
			source = 'Suspicious Vial',
			description = '&9Suspicious Bonus/&7Increases weapon damage by/&c+15&7.',
			-- effect = 'weapon_damage = weapon_damage + 15',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Gilded'] = {
			stats = {
				c = {},
				u = {},
				r = {},
				e = {},
				l = {
					ad = 8,
					dmg = 75,
					str = 75,
				},
				m = {
					ad = 10,
					dmg = 90,
					str = 90,
				},
			},
			source = 'Midas Jewel',
			description = '&9Byron\'s Compassion &8(Gilded)/&7Upon killing an enemy, you have a/&7rare chance to grant coins to a/&7player around you.',
			-- effect = 'Unrepresantable in stat form. Also, name of this reforge bonus is &1Byron\'s Compassion &7(Gilded)',
			costs = { l = 5000000, m = 10000000 },
		},
		['Warped'] = {
			stats = {
				c = {},
				u = {},
				r = {
					dmg = 165,
					int = 65,
					str = 165,
				},
				e = {
					dmg = 165,
					int = 100,
					str = 165,
				},
				l = {
					dmg = 165,
					int = 150,
					str = 165,
				},
				m = {},
			},
			source = 'Warped Stone',
			costs = {r = 500000, e = 1000000, l = 2000000 },
		},
		['Withered'] = {
			stats = {
				c = {
					str = 60,
				},
				u = {
					str = 75,
				},
				r = {
					str = 90,
				},
				e = {
					str = 110,
				},
				l = {
					str = 135,
				},
				m = {
					str = 170,
				},
			},
			source = 'Wither Blood',
			description = '&9Withered Bonus/&7Grants &a+1 &c Strength &7per/&cCatacombs &7level.',
			-- effect = 'total_str = total_str + catacombs_level',
			costs = {c = 10000, u = 20000, r = 30000, e = 40000, l = 50000, m = 60000 },
		},
		['Bulky'] = {
			stats = {
				c = {
					def = 2,
					hp = 4,
				},
				u = {
					def = 3,
					hp = 6,
				},
				r = {
					def = 5,
					hp = 9,
				},
				e = {
					def = 8,
					hp = 12,
				},
				l = {
					def = 13,
					hp = 15,
				},
				m = {
					def = 21,
					hp = 20,
				},
			},
			source = 'Bulky Stone',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Fanged'] = {
			stats = {
				c = {
					bas = 2,
					cc = 3,
					str = 30,
					vit = 2,
				},
				u = {
					bas = 3,
					cc = 4,
					str = 35,
					vit = 3,
				},
				r = {
					bas = 4,
					cc = 5,
					str = 40,
					vit = 4,
				},
				e = {
					bas = 6,
					cc = 7,
					str = 50,
					vit = 6,
				},
				l = {
					bas = 9,
					cc = 8,
					str = 60,
					vit = 8,
				},
				m = {
					bas = 10,
					cc = 10,
					str = 65,
					vit = 10,
				},
			},
			source = 'Full-Jaw Fanging Kit',
			description = '&9Fanged Bonus/&7Every &c7th &7melee hit on an enemy/&7deals &c+100% &7damage.',
			costs = {c = 10000, u = 12500, r = 25000, e = 50000, l = 100000, m = 250000 },
		},
		['Coldfused'] = {
			stats = {
				c = {
					cd = 20,
					mf = 2,
					str = 15,
				},
				u = {
					cd = 30,
					mf = 2,
					str = 20,
				},
				r = {
					cd = 40,
					mf = 2,
					str = 25,
				},
				e = {
					cd = 50,
					mf = 2,
					str = 35,
				},
				l = {
					cd = 60,
					mf = 2,
					str = 45,
				},
				m = {
					cd = 75,
					mf = 2,
					str = 55,
				},
			},
			source = 'Entropy Suppressor',
			description = '&9Coldfused Bonus/&8Only if Wisp is equipped/&c+75 Strength/&9+55 Crit Damage/&7Deal &62x &7to fire pillars, breaking one grants/&f+30 True Defense &7and &c+1.15x damage &7for &a60s&7.',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Jerry\'s'] = {
			stats = {
				c = {
					cd = 50,
					cc = 10,
					str = 25,
				},
				u = {
					cd = 50,
					cc = 10,
					str = 25,
				},
				r = {
					cd = 50,
					cc = 10,
					str = 25,
				},
				e = {
					cd = 50,
					cc = 10,
					str = 25,
				},
				l = {},
				m = {},
			},
			source = 'Jerry Stone',
			costs = {c = 1, u = 2, r = 3, e = 4},
		},
	},
	['Ranged Weapon'] = {
		['Deadly'] = {
			stats = {
				c = {
					cc = 10,
					cd = 5,
				},
				u = {
					cc = 13,
					cd = 10,
				},
				r = {
					cc = 16,
					cd = 18,
				},
				e = {
					cc = 19,
					cd = 32,
				},
				l = {
					cc = 22,
					cd = 50,
				},
				m = {
					cc = 25,
					cd = 78,
				},
			},
			source = 'Basic',
		},
		['Fine'] = {
			stats = {
				c = {
					cc = 5,
					cd = 2,
					str = 3,
				},
				u = {
					cc = 7,
					cd = 4,
					str = 7,
				},
				r = {
					cc = 9,
					cd = 7,
					str = 12,
				},
				e = {
					cc = 12,
					cd = 10,
					str = 18,
				},
				l = {
					cc = 15,
					cd = 15,
					str = 25,
				},
				m = {
					cc = 18,
					cd = 20,
					str = 33,
				},
			},
			source = 'Basic',
		},
		['Grand'] = {
			stats = {
				c = {
					str = 25,
				},
				u = {
					str = 32,
				},
				r = {
					str = 40,
				},
				e = {
					str = 50,
				},
				l = {
					str = 60,
				},
				m = {
					str = 75,
				},
			},
			source = 'Basic',
		},
		['Hasty'] = {
			stats = {
				c = {
					cc = 20,
					str = 3,
				},
				u = {
					cc = 25,
					str = 5,
				},
				r = {
					cc = 30,
					str = 7,
				},
				e = {
					cc = 40,
					str = 10,
				},
				l = {
					cc = 50,
					str = 15,
				},
				m = {
					cc = 75,
					str = 20,
				},
			},
			source = 'Basic',
		},
		['Neat'] = {
			stats = {
				c = {
					cc = 10,
					cd = 4,
					int = 3,
				},
				u = {
					cc = 12,
					cd = 8,
					int = 6,
				},
				r = {
					cc = 14,
					cd = 14,
					int = 10,
				},
				e = {
					cc = 17,
					cd = 20,
					int = 15,
				},
				l = {
					cc = 20,
					cd = 30,
					int = 20,
				},
				m = {
					cc = 25,
					cd = 40,
					int = 25,
				},
			},
			source = 'Basic',
		},
		['Rapid'] = {
			stats = {
				c = {
					cd = 35,
					str = 2,
				},
				u = {
					cd = 45,
					str = 3,
				},
				r = {
					cd = 55,
					str = 4,
				},
				e = {
					cd = 65,
					str = 7,
				},
				l = {
					cd = 75,
					str = 10,
				},
				m = {
					cd = 90,
					str = 15,
				},
			},
			source = 'Basic',
		},
		['Unreal'] = {
			stats = {
				c = {
					cc = 8,
					cd = 5,
					str = 3,
				},
				u = {
					cc = 9,
					cd = 10,
					str = 7,
				},
				r = {
					cc = 10,
					cd = 18,
					str = 12,
				},
				e = {
					cc = 11,
					cd = 32,
					str = 18,
				},
				l = {
					cc = 13,
					cd = 50,
					str = 25,
				},
				m = {
					cc = 15,
					cd = 70,
					str = 34,
				},
			},
			source = 'Basic',
		},
		['Awkward'] = {
			stats = {
				c = {
					cc = 10,
					cd = 5,
					int = -5,
				},
				u = {
					cc = 12,
					cd = 10,
					int = -10,
				},
				r = {
					cc = 15,
					cd = 15,
					int = -18,
				},
				e = {
					cc = 20,
					cd = 22,
					int = -32,
				},
				l = {
					cc = 25,
					cd = 30,
					int = -50,
				},
				m = {
					cc = 30,
					cd = 35,
					int = -72,
				},
			},
			source = 'Basic',
		},
		['Rich'] = {
			stats = {
				c = {
					cc = 10,
					cd = 1,
					int = 20,
					str = 2,
				},
				u = {
					cc = 12,
					cd = 2,
					int = 25,
					str = 3,
				},
				r = {
					cc = 14,
					cd = 4,
					int = 30,
					str = 4,
				},
				e = {
					cc = 17,
					cd = 7,
					int = 40,
					str = 7,
				},
				l = {
					cc = 20,
					cd = 10,
					int = 50,
					str = 10,
				},
				m = {
					cc = 25,
					cd = 15,
					int = 60,
					str = 15,
				},
			},
			source = 'Basic',
		},
		['Precise'] = {
			stats = {
				c = {
					cc = 8,
					cd = 5,
					str = 3,
				},
				u = {
					cc = 9,
					cd = 10,
					str = 7,
				},
				r = {
					cc = 10,
					cd = 18,
					str = 12,
				},
				e = {
					cc = 11,
					cd = 32,
					str = 18,
				},
				l = {
					cc = 13,
					cd = 50,
					str = 25,
				},
				m = {
					cc = 15,
					cd = 70,
					str = 34,
				},
			},
			source = 'Optical Lens',
			description = '&9Precise Bonus/&7Deal &a+10% &7extra damage when/&7arrows hit the head of a mob.',
			costs = {c = 30000, u = 75000, r = 150000, e = 300000, l = 600000, m = 1200000 },
		},
		['Spiritual'] = {
			stats = {
				c = {
					cc = 7,
					cd = 10,
					str = 4,
				},
				u = {
					cc = 8,
					cd = 15,
					str = 8,
				},
				r = {
					cc = 9,
					cd = 23,
					str = 14,
				},
				e = {
					cc = 10,
					cd = 37,
					str = 20,
				},
				l = {
					cc = 12,
					cd = 55,
					str = 28,
				},
				m = {
					cc = 14,
					cd = 75,
					str = 38,
				},
			},
			source = 'Spirit Stone',
			description = '&9Spiritual Bonus/&7Grants a &a10% &7chance to spawn/&7a Spirit Decoy when you kill an/&7enemy in a dungeon.',
			costs = {c = 60000, u = 125000, r = 250000, e = 500000, l = 1000000, m = 2000000 },
		},
		['Headstrong'] = {
			stats = {
				c = {
					cc = 10,
					cd = 4,
					str = 2,
				},
				u = {
					cc = 11,
					cd = 8,
					str = 5,
				},
				r = {
					cc = 12,
					cd = 16,
					str = 10,
				},
				e = {
					cc = 13,
					cd = 28,
					str = 16,
				},
				l = {
					cc = 15,
					cd = 42,
					str = 23,
				},
				m = {
					cc = 17,
					cd = 60,
					str = 33,
				},
			},
			source = 'Kaleidoscopic Mineral',
			description = '&9Headstrong Bonus/&7Deal &a+8% &7extra damage when/&7arrows hit the head of a mob.',
			costs = {c = 15000, u = 30000, r = 60000, e = 125000, l = 250000, m = 500000 },
		},
	},
	['Tool'] = {
		['Double-Bit'] = {
			stats = {
				c = {
					frf = 1,
					spd = 1,
				},
				u = {
					frf = 2,
					spd = 2,
				},
				r = {
					frf = 3,
					spd = 3,
				},
				e = {
					frf = 4,
					spd = 5,
				},
				l = {
					frf = 5,
					spd = 7,
				},
				m = {
					frf = 6,
					spd = 9,
				},
			},
			source = 'Basic',
			tool = 'Axe',
		},
		['Lumberjack\'s'] = {
			stats = {
				c = {
					spd = 1,
					frw = 0.5,
				},
				u = {
					spd = 2,
					frw = 0.75,
				},
				r = {
					spd = 3,
					frw = 1,
				},
				e = {
					spd = 5,
					frw = 1.5,
				},
				l = {
					spd = 7,
					frw = 2,
				},
				m = {
					spd = 9,
					frw = 2.5,
				},
			},
			source = 'Basic',
			description = '&9Lumberjack\'s Bonus/&7Grants &3+{1}☯ Foraging Wisdom&7.',
			substitution = {'frw'},
			tool = 'Axe',
		},
		['Great'] = {
			stats = {
				c = {
					cd = 2,
					spd = 1,
					str = 2,
				},
				u = {
					cd = 4,
					spd = 2,
					str = 4,
				},
				r = {
					cd = 6,
					spd = 3,
					str = 6,
				},
				e = {
					cd = 9,
					spd = 4,
					str = 9,
				},
				l = {
					cd = 12,
					spd = 5,
					str = 12,
				},
				m = {
					cd = 16,
					spd = 7,
					str = 16,
				},
			},
			source = 'Basic',
			tool = 'Axe',
		},
		['Rugged'] = {
			stats = {
				c = {
					cd = 3,
					str = 4,
				},
				u = {
					cd = 5,
					str = 6,
				},
				r = {
					cd = 8,
					str = 9,
				},
				e = {
					cd = 12,
					str = 13,
				},
				l = {
					cd = 16,
					str = 18,
				},
				m = {
					cd = 22,
					str = 24,
				},
			},
			source = 'Basic',
			tool = 'Axe',
		},
		['Moonglade'] = {
			stats = {
				c = {
					frf = 4,
					frw = 1,
				},
				u = {
					frf = 6,
					frw = 2,
				},
				r = {
					frf = 8,
					frw = 3,
				},
				e = {
					frf = 10,
					frw = 4,
				},
				l = {
					frf = 12,
					frw = 5,
				},
				m = {
					frf = 15,
					frw = 6,
				},
				d = {
					frf = 15,
					frw = 6,
				},
			},
			source = 'Moonglade Jewel',
			tool = 'Axe',
			costs = {c = 10000, u = 15000, r = 20000, e = 30000, l = 40000, m = 50000, d = 50000},
		},
		['Lush'] = {
			stats = {
				c = {
					frf = 1,
					spd = 3,
				},
				u = {
					frf = 1,
					spd = 4,
				},
				r = {
					frf = 2,
					spd = 5,
				},
				e = {
					frf = 2,
					spd = 7,
				},
				l = {
					frf = 3,
					spd = 10,
				},
				m = {
					frf = 5,
					spd = 15,
				},
			},
			source = 'Basic',
			tool = 'Axe',
		},
		['Green Thumb'] = {
			stats = {
				c = {
					fmf = 1,
					spd = 1,
				},
				u = {
					fmf = 2,
					spd = 2,
				},
				r = {
					fmf = 3,
					spd = 3,
				},
				e = {
					fmf = 4,
					spd = 5,
				},
				l = {
					fmf = 5,
					spd = 7,
				},
				m = {
					fmf = 6,
					spd = 9,
				},
			},
			source = 'Basic',
			tool = 'Farming Tool',
		},
		['Peasant\'s'] = {
			stats = {
				c = {
					spd = 1,
					fmw = 0.5,
				},
				u = {
					spd = 2,
					fmw = 0.75,
				},
				r = {
					spd = 3,
					fmw = 1,
				},
				e = {
					spd = 5,
					fmw = 1.5,
				},
				l = {
					spd = 7,
					fmw = 2,
				},
				m = {
					spd = 9,
					fmw = 2.5,
				},
			},
			source = 'Basic',
			description = '&9Peasants\'s Bonus/&7Grants &3+{1}☯ Farming Wisdom&7.',
			substitution = {'fmw'},
			tool = 'Farming Tool',
		},
		['Robust'] = {
			stats = {
				c = {
					fmf = 2,
				},
				u = {
					fmf = 3,
				},
				r = {
					fmf = 4,
				},
				e = {
					fmf = 6,
				},
				l = {
					fmf = 8,
				},
				m = {
					fmf = 10,
				},
			},
			source = 'Basic',
			tool = 'Farming Tool',
		},
		['Zooming'] = {
			stats = {
				c = {
					spd = 5,
				},
				u = {
					spd = 8,
				},
				r = {
					spd = 12,
				},
				e = {
					spd = 16,
				},
				l = {
					spd = 20,
				},
				m = {
					spd = 25,
				},
			},
			source = 'Basic',
			tool = 'Farming Tool',
		},
		['Unyielding'] = {
			stats = {
				c = {
					mnf = 1,
					spd = 1,
				},
				u = {
					mnf = 2,
					spd = 2,
				},
				r = {
					mnf = 3,
					spd = 3,
				},
				e = {
					mnf = 4,
					spd = 5,
				},
				l = {
					mnf = 5,
					spd = 7,
				},
				m = {
					mnf = 6,
					spd = 9,
				},
			},
			source = 'Basic',
			tool = 'Pickaxe, Drill',
		},
		['Prospector\'s'] = {
			stats = {
				c = {
					spd = 1,
					mw = 0.5,
				},
				u = {
					spd = 2,
					mw = 0.75,
				},
				r = {
					spd = 3,
					mw = 1,
				},
				e = {
					spd = 5,
					mw = 1.5,
				},
				l = {
					spd = 7,
					mw = 2,
				},
				m = {
					spd = 9,
					mw = 2.5,
				},
			},
			source = 'Basic',
			description = '&9Prospector\'s Bonus/&7Grants &3+{1}☯ Mining Wisdom&7.',
			substitution = {'mw'},
			tool = 'Pickaxe, Drill',
		},
		['Excellent'] = {
			stats = {
				c = {
					mns = 4,
					spd = 1,
				},
				u = {
					mns = 8,
					spd = 2,
				},
				r = {
					mns = 12,
					spd = 3,
				},
				e = {
					mns = 16,
					spd = 4,
				},
				l = {
					mns = 20,
					spd = 5,
				},
				m = {
					mns = 25,
					spd = 7,
				},
				d = {
					mns = 30,
					spd = 10,
				},
			},
			source = 'Basic',
			tool = 'Pickaxe, Drill',
		},
		['Sturdy'] = {
			stats = {
				c = {
					def = 3,
					mns = 3,
				},
				u = {
					def = 6,
					mns = 6,
				},
				r = {
					def = 9,
					mns = 9,
				},
				e = {
					def = 12,
					mns = 12,
				},
				l = {
					def = 15,
					mns = 15,
				},
				m = {
					def = 20,
					mns = 20,
				},
				d = {
					def = 25,
					mns = 25,
				},
			},
			source = 'Basic',
			tool = 'Pickaxe, Drill',
		},
		['Fortunate'] = {
			stats = {
				c = {
					mnf = 1,
					mns = 1,
				},
				u = {
					mnf = 1,
					mns = 2,
				},
				r = {
					mnf = 1,
					mns = 3,
				},
				e = {
					mnf = 2,
					mns = 4,
				},
				l = {
					mnf = 2,
					mns = 6,
				},
				m = {
					mnf = 3,
					mns = 8,
				},
				d = {
					mnf = 5,
					mns = 10,
				},
			},
			source = 'Basic',
			tool = 'Pickaxe, Drill',
		},
		['Moil'] = {
			stats = {
				c = {
					foragingwis = 1,
				},
				u = {
					foragingwis = 1,
				},
				r = {
					foragingwis = 2,
				},
				e = {
					foragingwis = 2,
				},
				l = {
					foragingwis = 3,
				},
				m = {
					foragingwis = 3,
				},
			},
			source = 'Moil Log',
			description = '&9Moil Bonus/&7Grants &3+{1}☯ Foraging Wisdom&7.',
			substitution = {'foragingwis'},
			costs = {c = 1000, u = 5000, r = 10000, e = 15000, l = 50000, m = 75000 },
			tool = 'Axe',
		},
		['Toil'] = {
			stats = {
				c = {
					cd = 5,
					str = 5,
					frw = 1,
				},
				u = {
					cd = 7,
					str = 7,
					frw = 2,
				},
				r = {
					cd = 9,
					str = 9,
					frw = 3,
				},
				e = {
					cd = 13,
					str = 13,
					frw = 4,
				},
				l = {
					cd = 16,
					str = 16,
					frw = 5,
				},
				m = {
					cd = 20,
					str = 20,
					frw = 6,
				},
			},
			source = 'Toil Log',
			description = '&9Toil Bonus/&7Grants &3+{1}☯ Foraging Wisdom&7.',
			substitution = {'frw'},
			costs = {c = 10000, u = 10000, r = 10000, e = 10000, l = 10000, m = 10000 },
			tool = 'Axe',
		},
		['Earthy'] = {
			stats = {
				c = {
					fmf = 5,
				},
				u = {
					fmf = 10,
				},
				r = {
					fmf = 15,
				},
				e = {
					fmf = 20,
				},
				l = {
					fmf = 25,
				},
				m = {
					fmf = 30,
				},
			},
			source = 'Large Walnut',
			description = '&9Earthly Bonus/&7Earn &2+5% Sowdust &7from farming&7.',
			tool = 'Farming Tool',
			costs = {c = 5000, u = 10000, r = 20000, e = 50000, l = 100000, m = 200000 },
		},
		['Beady'] = {
			stats = {
				c = {
					dmg = 5,
					int = 10,
				},
				u = {
					dmg = 10,
					int = 20,
				},
				r = {
					dmg = 15,
					int = 30,
				},
				e = {
					dmg = 20,
					int = 40,
				},
				l = {
					dmg = 25,
					int = 50,
				},
				m = {
					dmg = 30,
					int = 60,
				},
			},
			source = 'Beady Eyes',
			tool = 'Vacuum',
			description = '&9Beady Bonus/&7Grants &6+100 Farming Fortune &7on/&2Pests.',
			costs = {c = 10000, u = 20000, r = 50000, e = 75000, l = 100000, m = 150000 },
		},
		['Buzzing'] = {
			stats = {
				c = {
					fmf = 2,
				},
				u = {
					fmf = 3,
				},
				r = {
					fmf = 5,
				},
				e = {
					fmf = 7,
				},
				l = {
					fmf = 9,
				},
				m = {
					fmf = 11,
				},
			},
			source = 'Clipped Wings',
			tool = 'Vacuum',
			description = '&9Buzzing Bonus/&7Doubles the &c Damage &7dealt by/&aVacuums&7.',
			costs = {c = 10000, u = 20000, r = 50000, e = 75000, l = 100000, m = 150000 },
		},
		['Blessed'] = {
			stats = {
				c = {
					spd = 5,
					farmingfortune = 5,
					farmingwisdom = 1,
				},
				u = {
					spd = 7,
					farmingfortune = 7,
					farmingwisdom = 2,
				},
				r = {
					spd = 9,
					farmingfortune = 9,
					farmingwisdom = 3,
				},
				e = {
					spd = 13,
					farmingfortune = 13,
					farmingwisdom = 4,
				},
				l = {
					spd = 16,
					farmingfortune = 16,
					farmingwisdom = 5,
				},
				m = {
					spd = 20,
					farmingfortune = 20,
					farmingwisdom = 6,
				},
			},
			source = 'Blessed Fruit',
			description = '&9Blessed Bonus/&7Grants a &a0.22% &7chance to drop an/&7enchanted item when mining &6Crops&7.',
			costs = {c = 10000, u = 10000, r = 10000, e = 10000, l = 10000, m = 10000 },
			-- effect = 'total_fmf = total_fmf + farmingfortune',
			tool = 'Farming Tool',
		},
		['Bountiful'] = {
			stats = {
				c = {
					spd = 1,
					farmingfortune = '1',
				},
				u = {
					spd = 2,
					farmingfortune = '2',
				},
				r = {
					spd = 3,
					farmingfortune = '3',
				},
				e = {
					spd = 5,
					farmingfortune = '5',
				},
				l = {
					spd = 8,
					farmingfortune = '7',
				},
				m = {
					spd = 13,
					farmingfortune = '10',
				},
			},
			source = 'Golden Ball',
			description = '&9Bountiful Bonus/&7Grants &6+0.2 coins &7per crop.',
			substitution = {},
			costs = {c=20000, u=40000, r=80000, e=150000, l=300000, m=600000},
			-- effect = 'total_fmf = total_fmf + farmingfortune',
			tool = 'Farming Tool',
		},
		['Overpriced'] = {
			stats = {
				c = {
					overbloom = 1,
					farmingfortune = '5',
				},
				u = {
					overbloom = 2,
					farmingfortune = '10',
				},
				r = {
					overbloom = 3,
					farmingfortune = '15',
				},
				e = {
					overbloom = 5,
					farmingfortune = '20',
				},
				l = {
					overbloom = 7,
					farmingfortune = '25',
				},
			},
			source = 'Overpriced Drink',
			costs = {c=20000, u=40000, r=80000, e=150000, l=300000, m=600000},
			-- effect = 'total_fmf = total_fmf + farmingfortune',
			tool = 'Farming Tool',
		},
		['Deep Fried'] = {
			stats = {
				c = {
					farmingfortune = 3,
					seasonpct = '5',
				},
				u = {
					farmingfortune = 6,
					seasonpct = '10',
				},
				r = {
					farmingfortune = 10,
					seasonpct = '15',
				},
				e = {
					farmingfortune = 15,
					seasonpct = '20',
				},
				l = {
					farmingfortune = 20,
					seasonpct = '25',
				},
			},
			source = 'Hashbrown',
			description = '&9Deep Fried Bonus/&7Increases the odds of finding/&2Seasonings &7by &a+{1}%&7.',
			substitution = {'seasonpct'},
			costs = {c=20000, u=40000, r=80000, e=150000, l=300000},
			-- effect = 'total_fmf = total_fmf + farmingfortune',
			tool = 'Farming Tool',
		},
		['Magnetic'] = {
			stats = {
				c = {
					mns = 10,
					xpbonus = 25,
				},
				u = {
					mns = 20,
					xpbonus = 35,
				},
				r = {
					mns = 30,
					xpbonus = 45,
				},
				e = {
					mns = 40,
					xpbonus = 55,
				},
				l = {
					mns = 50,
					xpbonus = 65,
				},
				m = {
					mns = 75,
					xpbonus = 80,
				},
				d = {
					mns = 100,
					xpbonus = 100,
				},
			},
			source = 'Lapis Crystal',
			description = '&9Magnetic Bonus/&7Earn &a+{1}% &7more Exp when mining.',
			substitution = {'xpbonus'},
			tool = 'Drill, Pickaxe',
		},
		['Fruitful'] = {
			stats = {
				c = {
					mns = 5,
					mnf = 2,
					xdef = 25,
				},
				u = {
					mns = 10,
					mnf = 4,
					xdef = 30,
				},
				r = {
					mns = 15,
					mnf = 6,
					xdef = 35,
				},
				e = {
					mns = 25,
					mnf = 8,
					xdef = 40,
				},
				l = {
					mns = 40,
					mnf = 10,
					xdef = 50,
				},
				m = {
					mns = 55,
					mnf = 12,
					xdef = 60,
				},
				d = {
					mns = 70,
					mnf = 15,
					xdef = 70,
				},
				sp = {
					mns = 70,
					mnf = 15,
					xdef = 70,
				},
			},
			source = 'Black Diamond',
			description = '&9Fruitful Bonus/&7Grants &a+{1}  Defense &7while on &bMining Islands&7.',
			substitution = {'xdef'},
			-- effect = 'total_mnf = total_mnf + 3',
			tool = 'Drill, Pickaxe',
			costs = {c = 100, u = 250, r = 500, e = 1000, l = 2500, m = 15000, d = 15000, sp = 15000 }
		},
		['Refined'] = {
			stats = {
				c = {
					mw = 1,
					refinedbonus = 0.1,
				},
				u = {
					mw = 2,
					refinedbonus = 0.13,
				},
				r = {
					mw = 3,
					refinedbonus = 0.16,
				},
				e = {
					mw = 4,
					refinedbonus = 0.19,
				},
				l = {
					mw = 6,
					refinedbonus = 0.22,
				},
				m = {
					mw = 8,
					refinedbonus = 0.26,
				},
				d = {
					mw = 10,
					refinedbonus = 0.3,
				},
			},
			source = 'Andesite Whetstone',
			description = '&9Refined Bonus/&7Grants a &a{1}% &7chance to drop an enchanted item when mining &6Ores&7.',
			substitution = {'refinedbonus'},
			tool = 'Drill, Pickaxe',
			costs = {c=10000,u=10000,r=10000,e=10000,l=10000,m=10000,d=10000}
		},
		['Stellar'] = {
			stats = {
				c = {
					mns = 5,
					mnf = 5,
					mpowder = 8,
					xtramnf = 25,
				},
				u = {
					mns = 10,
					mnf = 10,
					mpowder = 9,
					xtramnf = 30,
				},
				r = {
					mns = 15,
					mnf = 15,
					mpowder = 10,
					xtramnf = 35,
				},
				e = {
					mns = 25,
					mnf = 20,
					mpowder = 12,
					xtramnf = 45,
				},
				l = {
					mns = 40,
					mnf = 25,
					mpowder = 14,
					xtramnf = 55,
				},
				m = {
					mns = 55,
					mnf = 35,
					mpowder = 17,
					xtramnf = 65,
				},
				d = {
					mns = 70,
					mnf = 50,
					mpowder = 20,
					xtramnf = 75,
				},
			},
			source = 'Petrified Starfall',
			description = '&9Stellar Bonus/&7Earn &2+{1}% Mithril Powder &7and &6+{2}/&6Mining Fortune &7when mining near a/&7Fallen Star.',
			substitution = {'mpowder', 'xtramnf'},
			costs = {c = 25000, u = 50000, r = 100000, e = 200000, l = 400000, m = 800000, d = 800000 },
			tool = 'Drill, Pickaxe',
		},
		['Mithraic'] = {
			stats = {
				c = {
					mnf = 3,
					extramnf = 10,
				},
				u = {
					mnf = 6,
					extramnf = 15,
				},
				r = {
					mnf = 9,
					extramnf = 20,
				},
				e = {
					mnf = 13,
					extramnf = 25,
				},
				l = {
					mnf = 16,
					extramnf = 30,
				},
				m = {
					mnf = 20,
					extramnf = 40,
				},
				d = {
					mnf = 25,
					extramnf = 50,
				},
			},
			source = 'Pure Mithril',
			description = '&9Mithraic Bonus/&7Grants &6{1} Mining Fortune &7when/&7mining &2Mithril &7or &fTitanium&7.',
			substitution = {'extramnf'},
			tool = 'Drill, Pickaxe',
			costs = {c = 15000, u = 30000, r = 60000, e = 125000, l = 250000, m = 500000, d = 500000 },
		},
		['Auspicious'] = {
			stats = {
				c = {
					mns = 10,
					mnf = 3,
					miningfort = 0.4,
				},
				u = {
					mns = 20,
					mnf = 6,
					miningfort = 0.5,
				},
				r = {
					mns = 30,
					mnf = 9,
					miningfort = 0.6,
				},
				e = {
					mns = 40,
					mnf = 13,
					miningfort = 0.7,
				},
				l = {
					mns = 50,
					mnf = 16,
					miningfort = 0.8,
				},
				m = {
					mns = 75,
					mnf = 20,
					miningfort = 0.9,
				},
				d = {
					mns = 100,
					mnf = 25,
					miningfort = 1,
				},
			},
			source = 'Dwarven Geode',
			description = '&9Auspicious Bonus/&7Grants &6+{1}% &6 Mining Fortune&7.',
			substitution = {'miningfort'},
			costs = {c=20000,u=40000,r=80000,e=150000,l=300000,m=600000,d=600000},
			-- effect = 'total_mnf = total_mnf + 8',
			tool = 'Drill, Pickaxe',
		},
		['Fleet'] = {
			stats = {
				c = {
					mns = 10,
					blkfrt = 25,
					miningspread = 50,
				},
				u = {
					mns = 20,
					blkfrt = 30,
					miningspread = 60,
				},
				r = {
					mns = 30,
					blkfrt = 35,
					miningspread = 70,
				},
				e = {
					mns = 40,
					blkfrt = 45,
					miningspread = 85,
				},
				l = {
					mns = 50,
					blkfrt = 55,
					miningspread = 100,
				},
				m = {
					mns = 75,
					blkfrt = 65,
					miningspread = 125,
				},
				d = {
					mns = 100,
					blkfrt = 75,
					miningspread = 150,
				},
			},
			source = 'Diamonite',
			description = '&9Fleet Bonus/&7Grants &e+{1} Mining Spread &7when/&7mining &9Blocks&7.',
			substitution = {'miningspread'},
			costs = {c = 15000, u = 30000, r = 60000, e = 125000, l = 250000, m = 500000, d = 500000 },
			tool = 'Drill, Pickaxe',
		},
		['Heated'] = {
			stats = {
				c = {
					mns = 5,
					mnf = 3,
					extramnf = 0.3,
					extramns = 1.
				},
				u = {
					mns = 10,
					mnf = 6,
					extramnf = 0.4,
					extramns = 1.4,
				},
				r = {
					mns = 15,
					mnf = 9,
					extramnf = 0.5,
					extramns = 1.8,
				},
				e = {
					mns = 25,
					mnf = 13,
					extramnf = 0.6,
					extramns = 2.2,
				},
				l = {
					mns = 40,
					mnf = 16,
					extramnf = 0.7,
					extramns = 2.8,
				},
				m = {
					mns = 55,
					mnf = 20,
					extramnf = 0.8,
					extramns = 3.4,
				},
				d = {
					mns = 70,
					mnf = 25,
					extramnf = 1,
					extramns = 4,
				},
			},
			source = 'Scorched Topaz',
			description = '&9Heated Bonus/&7Grants &6+{1} Mining Fortune &7and &6+{2} Mining Speed &7per &c1 Heat &7you have.',
			substitution = {'extramnf', 'extramns'},
			tool = 'Drill, Pickaxe',
			costs = {c=20000,u=40000,r=80000,e=150000,l=300000,m=600000,d=600000},
		},
		['Ambered'] = {
			stats = {
				c = {
					mns = 25,
					amberedbonus = 10,
				},
				u = {
					mns = 35,
					amberedbonus = 15,
				},
				r = {
					mns = 50,
					amberedbonus = 20,
				},
				e = {
					mns = 75,
					amberedbonus = 25,
				},
				l = {
					mns = 100,
					amberedbonus = 30,
				},
				m = {
					mns = 150,
					amberedbonus = 40,
				},
				d = {
					mns = 200,
					amberedbonus = 50,
				},
			},
			source = 'Amber Material',
			description = '&9Ambered Bonus/&7Increases/&7your chances of finding/&6Golden Goblins &7and &bDiamond/&bGoblins &7while mining by &a+{1}%&7.',
			substitution = {'amberedbonus'},
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000, d = 800000 },
			tool = 'Drill, Pickaxe',
		},
		['Lustrous'] = {
			stats = {
				c = {
					mnf = 10,
					mns = 10,
					miningspr = 5,
				},
				u = {
					mnf = 20,
					mns = 20,
					miningspr = 10,
				},
				r = {
					mnf = 30,
					mns = 30,
					miningspr = 15,
				},
				e = {
					mnf = 40,
					mns = 40,
					miningspr = 20,
				},
				l = {
					mnf = 50,
					mns = 50,
					miningspr = 25,
				},
				m = {
					mnf = 60,
					mns = 60,
					miningspr = 30,
				},
				d = {
					mnf = 75,
					mns = 75,
					miningspr = 35,
				},
			},
			source = 'Gleaming Crystal',
			description = '&9Lustrous Bonus/&7Grants &e+{1} Mining Spread &7during &6Mining Fiesta&7.',
			substitution = {'miningspr'},
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000, d = 800000 },
			tool = 'Drill, Pickaxe',
		},
		['Glacial'] = {
			stats = {
				c = {
					mnf = 3,
					miningfort = 0.5,
				},
				u = {
					mnf = 6,
					miningfort = 0.7,
				},
				r = {
					mnf = 9,
					miningfort = 0.9,
				},
				e = {
					mnf = 13,
					miningfort = 1.1,
				},
				l = {
					mnf = 16,
					miningfort = 1.4,
				},
				m = {
					mnf = 20,
					miningfort = 1.7,
				},
				d = {
					mnf = 25,
					miningfort = 2,
				},
			},
			source = 'Frigid Husk',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000, d = 800000 },
			description = '&9Glacial Bonus/&7Grants &6+{1} Mining Fortune &7for/&7every &b1 Cold &7you have.',
			substitution = {'miningfort'},
			tool = 'Drill, Pickaxe',
		},
		['Scraped'] = {
			stats = {
				c = {
					bp = 1,
					mw = 1,
					mnf = 5,
				},
				u = {
					bp = 1,
					mw = 1,
					mnf = 10,
				},
				r = {
					bp = 1,
					mw = 1,
					mnf = 15,
				},
				e = {
					bp = 1,
					mw = 2,
					mnf = 20,
				},
				l = {
					bp = 1,
					mw = 2,
					mnf = 25,
				},
				m = {
					bp = 1,
					mw = 2,
					mnf = 35,
				},
				d = {
					bp = 1,
					mw = 3,
					mnf = 50,
				},
			},
			source = 'Pocket Iceberg',
			costs = {c = 15000, u = 30000, r = 60000, e = 125000, l = 250000, m = 500000, d = 500000},
			description = '&9Scraped Bonus/&7Grants &6+{1} Mining Fortune &7if the/&7block you are mining has the same &2/&2Breaking Power &7as this tool./',
			substitution = {'mnf'},
			tool = 'Drill, Pickaxe',
		},
		['Erudite'] = {
			stats = {
				r = {
					spd = 8,
				},
				e = {
					spd = 11,
				},
				l = {
					spd = 15,
				},
				m = {
					spd = 20,
				},
			},
			source = 'Daedalus\' Notes',
			description = '&9Erudite Bonus/&eGriffin Burrow &7chain always consist/&7of &a2 &7additional burrows.',
			tool = 'Spade',
			costs = {r = 500000, e = 1000000, l = 2000000, m = 2000000 },
		},
	},
	['Fishing Rod'] = {
		['Salty'] = {
			stats = {
				c = {
					scc = 1,
				},
				u = {
					scc = 2,
				},
				r = {
					scc = 2,
				},
				e = {
					scc = 3,
				},
				l = {
					scc = 5,
				},
				m = {
					scc = 7,
				},
			},
			source = 'Salt Cube',
			costs = {c = 2500, u = 10000, r = 20000, e = 40000, l = 80000, m = 120000 },
		},
		['Trashy'] = {
			stats = {
				c = {
					scc = 0.5,
					fs = 1,
				},
				u = {
					scc = 1,
					fs = 2,
				},
				r = {
					scc = 1.5,
					fs = 3,
				},
				e = {
					scc = 2,
					fs = 4,
				},
				l = {
					scc = 3,
					fs = 6,
				},
				m = {
					scc = 4,
					fs = 8,
				},
				d = {
					scc = 4,
					fs = 8,
				},
			},
			source = 'Overflowing Trash Can',
			description = '&9Trashy Bonus/&7Grants &6+1  Treasure Chance &7while in the &2Backwater Bayou.',
			costs = {c = 2500, u = 10000, r = 20000, e = 40000, l = 80000, m = 120000, d = 500000 },
		},
		['Treacherous'] = {
			stats = {
				c = {
					scc = 1,
					str = 5,
				},
				u = {
					scc = 2,
					str = 10,
				},
				r = {
					scc = 2,
					str = 15,
				},
				e = {
					scc = 3,
					str = 20,
				},
				l = {
					scc = 5,
					str = 25,
				},
				m = {
					scc = 7,
					str = 30,
				},
			},
			source = 'Rusty Anchor',
			costs = {c = 5000, u = 20000, r = 40000, e = 80000, l = 120000, m = 280000 },
		},
		['Stiff'] = {
			stats = {
				c = {
					scc = 1,
					str = 2,
				},
				u = {
					scc = 2,
					str = 4,
				},
				r = {
					scc = 2,
					str = 6,
				},
				e = {
					scc = 3,
					str = 8,
				},
				l = {
					scc = 5,
					str = 10,
				},
				m = {
					scc = 7,
					str = 12,
				},
			},
			source = 'Hardened Wood',
			costs = {c = 4000, u = 7500, r = 15000, e = 40000, l = 75000, m = 150000 },
		},
		['Lucky'] = {
			stats = {
				c = {
					mf = 1,
					scc = 1,
				},
				u = {
					mf = 2,
					scc = 2,
				},
				r = {
					mf = 3,
					scc = 2,
				},
				e = {
					mf = 4,
					scc = 3,
				},
				l = {
					mf = 5,
					scc = 5,
				},
				m = {
					mf = 6,
					scc = 7,
				},
			},
			source = 'Lucky Dice',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Pitchin\''] = {
			stats = {
				c = {
					fs = 1,
					scc = 1,
				},
				u = {
					fs = 2,
					scc = 1,
				},
				r = {
					fs = 4,
					scc = 2,
				},
				e = {
					fs = 6,
					scc = 3,
				},
				l = {
					fs = 8,
					scc = 4,
				},
				m = {
					fs = 10,
					scc = 5,
				},
			},
			source = 'Pitchin\' Koi',
			costs = {c = 5000, u = 20000, r = 40000, e = 80000, l = 120000, m = 280000 },
		},
		['Chomp'] = {
			stats = {
				c = {
					cc = 5,
					fs = 2,
					str = 5,
				},
				u = {
					cc = 10,
					fs = 3,
					str = 10,
				},
				r = {
					cc = 17,
					fs = 5,
					str = 17,
				},
				e = {
					cc = 25,
					fs = 7,
					str = 25,
				},
				l = {
					cc = 35,
					fs = 9,
					str = 35,
				},
				m = {
					cc = 50,
					fs = 11,
					str = 50,
				},
			},
			source = 'Kuudra Mandible',
			description = '&9Chomp Bonus/&7Decreases the health of Lava Sea/&7Creatures by &c1% &7for each unique/&7Lava Sea Creature you have killed/&7with this rod in your inventory.',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
	},
	['Equipment'] = {
		['Stained'] = {
			stats = {
				c = {
					def = 2,
					hp = 2,
					cc = 1,
				},
				u = {
					def = 3,
					hp = 3,
					cc = 1,
				},
				r = {
					def = 4,
					hp = 4,
					cc = 2,
				},
				e = {
					def = 5,
					hp = 5,
					cc = 2,
				},
				l = {
					def = 6,
					hp = 6,
					cc = 3,
				},
				m = {
					def = 7,
					hp = 7,
					cc = 4,
				},
			},
			source = 'Basic',
		},
		['Menacing'] = {
			stats = {
				c = {
					cc = 1,
					cd = 2,
				},
				u = {
					cc = 1,
					cd = 3,
				},
				r = {
					cc = 1,
					cd = 3,
				},
				e = {
					cc = 1,
					cd = 4,
				},
				l = {
					cc = 2,
					cd = 4,
				},
				m = {
					cc = 2,
					cd = 5,
				},
			},
			source = 'Basic',
		},
		['Lunar'] = {
				stats = {
					c = {
						spd = 1,
						fmw = 1,
					},
					u = {
						spd = 1,
						fmw = 1,
					},
					r = {
						spd = 2,
						fmw = 2,
					},
					e = {
						spd = 2,
						fmw = 2,
					},
					l = {
						spd = 3,
						fmw = 3,
					},
					m = {
						spd = 4,
						fmw = 4,
					},
				},
				source = 'Moonstone',
				costs = {c = 5000, u = 10000, r = 20000, e = 50000, l = 100000, m = 200000 },
		},
		['Hefty'] = {
			stats = {
				c = {
					cd = -2,
					def = 7,
					spd = -1,
				},
				u = {
					cd = -2,
					def = 9,
					spd = -1,
				},
				r = {
					cd = -3,
					def = 12,
					spd = -1,
				},
				e = {
					cd = -3,
					def = 15,
					spd = -1,
				},
				l = {
					cd = -4,
					def = 20,
					spd = -1,
				},
				m = {
					cd = -5,
					def = 25,
					spd = -1,
				},
			},
			source = 'Basic',
		},
		['Soft'] = {
			stats = {
				c = {
					cc = 1,
					cd = 1,
					def = 1,
					hp = 2,
					as = 1,
					spd = 1,
				},
				u = {
					cc = 1,
					cd = 1,
					def = 1,
					hp = 3,
					as = 1,
					spd = 1,
				},
				r = {
					cc = 1,
					cd = 1,
					def = 1,
					hp = 4,
					as = 1,
					spd = 1,
				},
				e = {
					cc = 1,
					cd = 2,
					def = 1,
					hp = 5,
					as = 1,
					spd = 1,
				},
				l = {
					cc = 1,
					cd = 2,
					def = 2,
					hp = 6,
					as = 1,
					spd = 2,
				},
				m = {
					cc = 1,
					cd = 2,
					def = 2,
					hp = 7,
					as = 2,
					spd = 2,
				},
			},
			source = 'Basic',
		},
		['Honored'] = {
			stats = {
				c = {
					cc = 1,
					def = 1,
					hp = 1,
					int = 3,
					spd = 1,
				},
				u = {
					cc = 1,
					def = 2,
					hp = 1,
					int = 3,
					spd = 1,
					str = 1,
				},
				r = {
					cc = 1,
					def = 2,
					hp = 2,
					int = 4,
					spd = 1,
					str = 2,
				},
				e = {
					cc = 2,
					def = 3,
					hp = 2,
					int = 5,
					spd = 1,
					str = 2,
				},
				l = {
					cc = 2,
					def = 3,
					hp = 3,
					int = 6,
					spd = 1,
					str = 3,
				},
				m = {
					cc = 2,
					def = 4,
					hp = 4,
					int = 7,
					spd = 1,
					str = 3,
				},
			},
			source = 'Basic',
		},
		['Blended'] = {
			stats = {
				c = {
					as = 1,
					cc = 1,
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
				},
				u = {
					as = 1,
					cc = 1,
					cd = 2,
					def = 1,
					hp = 1,
					int = 1,
					str = 1,
					spd = 1,
				},
				r = {
					as = 1,
					cc = 2,
					cd = 2,
					def = 1,
					hp = 2,
					int = 1,
					str = 1,
					spd = 1,
				},
				e = {
					as = 1,
					cc = 2,
					cd = 2,
					def = 2,
					hp = 2,
					int = 2,
					str = 2,
					spd = 1,
				},
				l = {
					as = 1,
					cc = 3,
					cd = 2,
					def = 3,
					hp = 2,
					int = 2,
					str = 2,
					spd = 1,
				},
				m = {
					as = 1,
					cc = 3,
					cd = 2,
					def = 3,
					hp = 3,
					int = 3,
					str = 2,
					spd = 1,
				},
			},
			source = 'Basic',
		},
		['Astute'] = {
			stats = {
				c = {
					def = 1,
					hp = 1,
					int = 3,
				},
				u = {
					def = 2,
					hp = 1,
					int = 4,
				},
				r = {
					def = 2,
					hp = 2,
					int = 5,
				},
				e = {
					def = 3,
					hp = 3,
					int = 6,
				},
				l = {
					def = 4,
					hp = 4,
					int = 8,
				},
				m = {
					def = 5,
					hp = 5,
					int = 10,
				},
			},
			source = 'Basic',
		},
		['Colossal'] = {
			stats = {
				c = {
					def = 3,
					hp = 3,
				},
				u = {
					def = 4,
					hp = 4,
				},
				r = {
					def = 6,
					hp = 6,
				},
				e = {
					def = 8,
					hp = 8,
				},
				l = {
					def = 10,
					hp = 10,
				},
				m = {
					def = 12,
					hp = 12,
				},
			},
			source = 'Basic',
		},
		['Brilliant'] = {
			stats = {
				c = {
					hp = 1,
					int = 5,
					spd = 1,
				},
				u = {
					hp = 1,
					int = 6,
					spd = 1,
				},
				r = {
					hp = 2,
					int = 7,
					spd = 2,
				},
				e = {
					hp = 3,
					int = 9,
					spd = 2,
				},
				l = {
					hp = 4,
					int = 12,
					spd = 2,
				},
				m = {
					hp = 5,
					int = 15,
					spd = 2,
				},
			},
			source = 'Basic',
		},
		['Waxed'] = {
			stats = {
				c = {
					hp = 5,
					cc = 2,
				},
				u = {
					hp = 6,
					cc = 3,
				},
				r = {
					hp = 8,
					cc = 4,
				},
				e = {
					hp = 10,
					cc = 5,
				},
				l = {
					hp = 12,
					cc = 6,
				},
				m = {
					hp = 15,
					cc = 7,
				},
				d = {
					hp = 20,
					cc = 8,
				},
			},
			source = 'Blaze Wax',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000, d = 400000 },
		},
		['Fortified'] = {
			stats = {
				c = {
					def = 12,
				},
				u = {
					def = 14,
				},
				r = {
					def = 17,
				},
				e = {
					def = 20,
				},
				l = {
					def = 25,
				},
				m = {
					def = 30,
				},
				d = {
					def = 30,
				},
			},
			source = 'Meteor Chunk',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000, d = 400000 },
		},
		['Strengthened'] = {
			stats = {
				c = {
					def = 3,
					str = 2,
				},
				u = {
					def = 4,
					str = 3,
				},
				r = {
					def = 5,
					str = 4,
				},
				e = {
					def = 6,
					str = 5,
				},
				l = {
					def = 8,
					str = 6,
				},
				m = {
					def = 10,
					str = 7,
				},
				d = {
					def = 12,
					str = 8,
				},
			},
			source = 'Searing Stone',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000, d = 400000 },
		},
		['Glistening'] = {
			stats = {
				c = {
					int = 5,
					td = 2,
				},
				u = {
					int = 6,
					td = 2.5,
				},
				r = {
					int = 8,
					td = 3,
				},
				e = {
					int = 10,
					td = 3.5,
				},
				l = {
					int = 12,
					td = 4,
				},
				m = {
					int = 15,
					td = 4.5,
				},
				d = {
					int = 18,
					td = 4.5,
				},
			},
			source = 'Shiny Prism',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000, d = 400000 },
		},
		['Royal'] = {
			stats = {
				c = {
					mns = 4,
					mnf = 1,
				},
				u = {
					mns = 6,
					mnf = 1,
				},
				r = {
					mns = 8,
					mnf = 2,
				},
				e = {
					mns = 10,
					mnf = 2,
				},
				l = {
					mns = 14,
					mnf = 3,
				},
				m = {
					mns = 18,
					mnf = 3,
				},
			},
			description = '&9Royal Bonus/&7Earn &2+15% ᠅ Mithril Powder &7from &bMining Events &7in the &2Dwarven Mines&7.',
			source = 'Dwarven Treasure',
			costs = {c = 5000, u = 10000, r = 20000, e = 50000, l = 100000, m = 100000},
		},
		['Blood-Soaked'] = {
			stats = {
				c = {
					def = 1,
					hp = 6,
					vt = 1,
				},
				u = {
					def = 2,
					hp = 8,
					vt = 1,
				},
				r = {
					def = 3,
					hp = 8,
					vt = 2,
				},
				e = {
					def = 4,
					hp = 9,
					vt = 2,
				},
				l = {
					def = 5,
					hp = 10,
					vt = 3,
				},
				m = {
					def = 6,
					hp = 12,
					vt = 3,
				},
			},
			description = '&9Blood-Soaked Bonus/&7Increased the enchantment effects/ of &9Lifesteal&7, &9Vampirism &7and &9Drain &7by/ &a1 &7level.', 
			source = 'Presumed Gallon of Red Paint',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 300000 },
		},
		['Blooming'] = {
			stats = {
				c = {
					fmf = 1,
					spd = 4,
				},
				u = {
					fmf = 2,
					spd = 4,
				},
				r = {
					fmf = 3,
					spd = 5,
				},
				e = {
					fmf = 4,
					spd = 5,
				},
				l = {
					fmf = 5,
					spd = 6,
				},
				m = {
					fmf = 6,
					spd = 6,
				},
			},
			source = 'Flowering Bouquet',
			costs = {c = 5000, u = 10000, r = 20000, e = 50000, l = 100000, m = 200000 },
		},
		['Rooted'] = {
			stats = {
				c = {
					hp = 2,
					fmf = 6,
				},
				u = {
					hp = 5,
					fmf = 9,
				},
				r = {
					hp = 8,
					fmf = 12,
				},
				e = {
					hp = 11,
					fmf = 15,
				},
				l = {
					hp = 14,
					fmf = 18,
				},
				m = {
					hp = 17,
					fmf = 21,
				},
			},
			source = 'Burrowing Spores',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000 },
		},
		['Snowy'] = {
			stats = {
				c = {
					fs = 0.5,
					scc = 0.2,
				},
				u = {
					fs = 1,
					scc = 0.2,
				},
				r = {
					fs = 1.5,
					scc = 0.4,
				},
				e = {
					fs = 2,
					scc = 0.6,
				},
				l = {
					fs = 2.5,
					scc = 0.8,
				},
				m = {
					fs = 3,
					scc = 1,
				},
			},
			source = 'Terry\'s Snowglobe',
			costs = {c = 10000, u = 25000, r = 50000, e = 100000, l = 200000, m = 300000 },
		},
		['Blazing'] = {
			stats = {
				c = {
					mnf = 3,
					hrs = 1
				},
				u = {
					mnf = 4,
					hrs = 1,
				},
				r = {
					mnf = 5,
					hrs = 2,
				},
				e = {
					mnf = 6,
					hrs = 2,
				},
				l = {
					mnf = 7,
					hrs = 3,
				},
				m = {
					mnf = 8,
					hrs = 3,
				},
				d = {
					mnf = 8,
					hrs = 3,
				}
			},
			description = '&9Blazing Bonus/&7For every &c1 Heat &7you have, gain a &a+0.05% &7chance to dig up &9Worms&7.',
			source = 'Blazen Sphere',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 300000, d = 300000},
		},
		['Greater Spook'] = {
			stats = {
				c = {},
				u = {},
				r = {},
				e = {
					fear = 4,
				},
				l = {
					fear = 5,
				},
				m = {},
			},
			source = 'Boo Stone',
			description = '&9Greater Spook Bonus/&7Grants &a+1 &5Fear&7.',
			costs = {e = 10000, l = 10000},
		},
		['Squeaky'] = {
			stats = {
				c = {
					bpc = 0.5,
					fmf = 2,
				},
				u = {
					bpc = 0.5,
					fmf = 4,
				},
				r = {
					bpc = 1,
					fmf = 6,
				},
				e = {
					bpc = 1.5,
					fmf = 8,
				},
				l = {
					bpc = 2,
					fmf = 10,
				},
				m = {
					bpc = 2.5,
					fmf = 12,
				},
			},
			source = 'Squeaky Toy',
			description = '&9Squeaky Bonus/&7Decreases the spawn cooldown of &2/&2Pests &7by &a2.5%&7.',
			costs = {c = 7500, u = 15000, r = 30000, e = 75000, l = 150000, m = 150000},
		},
				['Thorny'] = {
			stats = {
				c = {
					overbloom = 0.25,
					fmf = 2,
				},
				u = {
					overbloom = 0.5,
					fmf = 4,
				},
				r = {
					overbloom = 0.75,
					fmf = 6,
				},
				e = {
					overbloom = 1,
					fmf = 8,
				},
				l = {
					overbloom = 1.25,
					fmf = 10,
				},
				m = {
					overbloom = 1.5,
					fmf = 12,
				},
			},
			source = 'Blooming Thorns',
			description = '&9Thorny Bonus/&7Grants an additional &e+0.1 /&eOverbloom &7per tier of &9Thorns &7on all/&7of your armor pieces.',
			costs = {c = 20000, u = 40000, r = 80000, e = 150000, l = 300000, m = 600000},
		},
	},
	['Belts'] = {
		['Bloodshot'] = {
			stats = {
				c = {
					cc = 1,
					cd = 1,
					str = 1,
				},
				u = {
					cc = 2,
					cd = 2,
					str = 2,
				},
				r = {
					cc = 3,
					cd = 3,
					str = 3,
				},
				e = {
					cc = 4,
					cd = 4,
					str = 4,
				},
				l = {
					cc = 5,
					cd = 5,
					str = 5,
				},
				m = {
					cc = 6,
					cd = 6,
					str = 6,
				},
			},
			source = 'Shriveled Cornea',
			description = '&9Bloodshot Bonus/&7When killing an enemy, you have a/&a2.5% &7chance to cocoon them!/Cocooned enemies will quickly hatch,/and can be killed again./&8(Cannot trigger in Dungeons, Kuudra,/or on Bosses).',
			costs = {c = 50000, u = 100000, r = 250000, e = 500000, l = 1000000, m = 2500000 },
		},
	},
	-- The Accessory section is kept as a historical snapshot
	-- of accessory reforges at their time of removal
	['Accessory'] = {
		['Bizarre'] = {
			stats = {
				c = {
					cd = -1,
					hp = 1,
					int = 6,
					str = 1,
				},
				u = {
					cd = -2,
					hp = 1,
					int = 8,
					str = 2,
				},
				r = {
					cd = -2,
					hp = 1,
					int = 10,
					str = 2,
				},
				e = {
					cd = -3,
					hp = 1,
					int = 14,
					str = 3,
				},
				l = {
					cd = -5,
					hp = 1,
					int = 20,
					str = 5,
				},
				m = {
					cd = -5,
					hp = 1,
					int = 30,
					str = 7,
				},
			},
			source = 'Basic',
		},
		['Itchy'] = {
			stats = {
				c = {
					cd = 3,
					str = 1,
				},
				u = {
					cd = 4,
					str = 1,
				},
				r = {
					bas = 1,
					cd = 5,
					str = 1,
				},
				e = {
					bas = 1,
					cd = 7,
					str = 2,
				},
				l = {
					bas = 1,
					cd = 10,
					str = 3,
				},
				m = {
					bas = 1,
					cd = 15,
					str = 4,
				},
			},
			source = 'Basic',
		},
		['Ominous'] = {
			stats = {
				c = {
					cd = 1,
					def = 1,
					hp = 1,
					str = 1,
				},
				u = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					str = 1,
				},
				r = {
					cd = 1,
					def = 1,
					hp = 2,
					int = 2,
					str = 1,
				},
				e = {
					cd = 1,
					def = 2,
					hp = 3,
					int = 3,
					str = 2,
				},
				l = {
					cd = 1,
					def = 3,
					hp = 4,
					int = 4,
					str = 3,
				},
				m = {
					cd = 1,
					def = 5,
					hp = 5,
					int = 5,
					str = 4,
				},
			},
			source = 'Basic',
		},
		['Pleasant'] = {
			stats = {
				c = {
					def = 4,
				},
				u = {
					def = 5,
				},
				r = {
					def = 7,
				},
				e = {
					def = 10,
				},
				l = {
					def = 15,
				},
				m = {
					def = 20,
				},
			},
			source = 'Basic',
		},
		['Pretty'] = {
			stats = {
				c = {
					hp = 1,
					int = 3,
				},
				u = {
					hp = 1,
					int = 4,
				},
				r = {
					bas = 1,
					hp = 2,
					int = 6,
				},
				e = {
					bas = 1,
					hp = 2,
					int = 9,
					spd = 1,
				},
				l = {
					bas = 1,
					hp = 3,
					int = 13,
					spd = 1,
				},
				m = {
					bas = 1,
					hp = 4,
					int = 19,
					spd = 2,
				},
			},
			source = 'Basic',
		},
		['Shiny'] = {
			stats = {
				c = {
					hp = 4,
					int = 1,
				},
				u = {
					hp = 5,
					int = 2,
				},
				r = {
					hp = 7,
					int = 2,
				},
				e = {
					hp = 10,
					int = 3,
				},
				l = {
					hp = 15,
					int = 5,
				},
				m = {
					hp = 20,
					int = 5,
				},
			},
			source = 'Basic',
		},
		['Simple'] = {
			stats = {
				c = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
				u = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
				r = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
				e = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
				l = {
					cd = 1,
					def = 1,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
				m = {
					cd = 1,
					def = 2,
					hp = 1,
					int = 1,
					spd = 1,
					str = 1,
				},
			},
			source = 'Basic',
		},
		['Strange'] = {
			stats = {
				c = {
					bas = -1,
					cd = 1,
					int = 1,
					spd = 1,
					str = 2,
				},
				u = {
					bas = 2,
					cd = 2,
					def = 3,
					int = -1,
					str = 1,
				},
				r = {
					def = 2,
					int = 2,
					spd = 1,
					str = -1,
				},
				e = {
					bas = 4,
					cd = 1,
					def = -1,
					str = 3,
				},
				l = {
					cd = 7,
					def = 1,
					int = 8,
					spd = 3,
				},
				m = {
					bas = 5,
					cd = 9,
					def = 1,
					int = 11,
					spd = 3,
					str = 4,
				},
			},
			source = 'Basic',
		},
		['Vivid'] = {
			stats = {
				c = {
					hp = 1,
					spd = 1,
				},
				u = {
					hp = 2,
					spd = 2,
				},
				r = {
					hp = 3,
					spd = 3,
				},
				e = {
					hp = 4,
					spd = 4,
				},
				l = {
					hp = 5,
					spd = 5,
				},
				m = {
					hp = 6,
					spd = 6,
				},
			},
			source = 'Basic',
		},
		['Godly'] = {
			stats = {
				c = {
					cd = 2,
					int = 1,
					str = 1,
				},
				u = {
					cd = 2,
					int = 1,
					str = 2,
				},
				r = {
					cd = 3,
					int = 1,
					str = 3,
				},
				e = {
					cd = 4,
					int = 2,
					str = 5,
				},
				l = {
					cd = 6,
					int = 4,
					str = 7,
				},
				m = {
					cd = 8,
					int = 6,
					str = 10,
				},
			},
			source = 'Basic',
		},
		['Demonic'] = {
			stats = {
				c = {
					int = 5,
					str = 1,
				},
				u = {
					int = 7,
					str = 2,
				},
				r = {
					int = 9,
					str = 2,
				},
				e = {
					int = 12,
					str = 3,
				},
				l = {
					int = 17,
					str = 5,
				},
				m = {
					int = 24,
					str = 7,
				},
			},
			source = 'Basic',
		},
		['Forceful'] = {
			stats = {
				c = {
					str = 4,
				},
				u = {
					str = 5,
				},
				r = {
					str = 7,
				},
				e = {
					str = 10,
				},
				l = {
					str = 15,
				},
				m = {
					str = 20,
				},
			},
			source = 'Basic',
		},
		['Hurtful'] = {
			stats = {
				c = {
					cd = 4,
				},
				u = {
					cd = 5,
				},
				r = {
					cd = 7,
				},
				e = {
					cd = 10,
				},
				l = {
					cd = 15,
				},
				m = {
					cd = 20,
				},
			},
			source = 'Basic',
		},
		['Keen'] = {
			stats = {
				c = {
					def = 1,
					hp = 1,
					int = 1,
				},
				u = {
					def = 2,
					hp = 2,
					int = 1,
				},
				r = {
					def = 3,
					hp = 3,
					int = 2,
				},
				e = {
					def = 4,
					hp = 4,
					int = 3,
				},
				l = {
					def = 5,
					hp = 5,
					int = 5,
				},
				m = {
					def = 7,
					hp = 7,
					int = 7,
				},
			},
			source = 'Basic',
		},
		['Strong'] = {
			stats = {
				c = {
					cd = 1,
					str = 1,
				},
				u = {
					cd = 2,
					str = 2,
				},
				r = {
					cd = 3,
					def = 1,
					str = 3,
				},
				e = {
					cd = 5,
					def = 2,
					str = 5,
				},
				l = {
					cd = 8,
					def = 3,
					str = 8,
				},
				m = {
					cd = 12,
					def = 4,
					str = 12,
				},
			},
			source = 'Basic',
		},
		['Superior'] = {
			stats = {
				c = {
					cd = 2,
					str = 2,
				},
				u = {
					cd = 2,
					str = 3,
				},
				r = {
					cd = 2,
					str = 4,
				},
				e = {
					cd = 3,
					str = 5,
				},
				l = {
					cd = 3,
					str = 7,
				},
				m = {
					cd = 5,
					str = 10,
				},
			},
			source = 'Basic',
		},
		['Unpleasant'] = {
			stats = {
				c = {
					cc = 1,
				},
				u = {
					cc = 1,
				},
				r = {
					cc = 1,
				},
				e = {
					cc = 2,
				},
				l = {
					cc = 2,
				},
				m = {
					cc = 3,
				},
			},
			source = 'Basic',
		},
		['Zealous'] = {
			stats = {
				c = {
					cd = 1,
					int = 1,
					str = 1,
				},
				u = {
					cd = 2,
					int = 2,
					str = 2,
				},
				r = {
					cd = 2,
					int = 2,
					spd = 1,
					str = 2,
				},
				e = {
					cd = 3,
					int = 3,
					spd = 1,
					str = 3,
				},
				l = {
					cd = 5,
					int = 5,
					spd = 1,
					str = 5,
				},
				m = {
					cd = 7,
					int = 7,
					spd = 2,
					str = 7,
				},
			},
			source = 'Basic',
		},
		['Silky'] = {
			stats = {
				c = {
					cd = 5,
				},
				u = {
					cd = 6,
				},
				r = {
					cd = 8,
				},
				e = {
					cd = 10,
				},
				l = {
					cd = 15,
				},
				m = {
					cd = 20,
				},
			},
			source = 'Luxurious Spool',
		},
		['Bloody'] = {
			stats = {
				c = {
					bas = 1,
					cd = 3,
					spd = 1,
					str = 1,
				},
				u = {
					bas = 1,
					cd = 4,
					spd = 1,
					str = 1,
				},
				r = {
					bas = 1,
					cd = 5,
					spd = 1,
					str = 1,
				},
				e = {
					bas = 2,
					cd = 6,
					spd = 1,
					str = 2,
				},
				l = {
					bas = 2,
					cd = 9,
					spd = 1,
					str = 3,
				},
				m = {
					bas = 2,
					cd = 14,
					spd = 1,
					str = 4,
				},
			},
			source = 'Beating Heart',
		},
		['Shaded'] = {
			stats = {
				c = {
					cd = 3,
					str = 2,
				},
				u = {
					cd = 4,
					str = 3,
				},
				r = {
					cd = 5,
					str = 4,
				},
				e = {
					cd = 6,
					str = 5,
				},
				l = {
					cc = 1,
					cd = 9,
					str = 6,
				},
				m = {
					cc = 1,
					cd = 14,
					str = 8,
				},
			},
			source = 'Dark Orb',
		},
		['Sweet'] = {
			stats = {
				c = {
					def = 1,
					hp = 3,
					spd = 1,
				},
				u = {
					def = 1,
					hp = 4,
					spd = 1,
				},
				r = {
					def = 2,
					hp = 6,
					spd = 2,
				},
				e = {
					def = 3,
					hp = 8,
					spd = 2,
				},
				l = {
					def = 4,
					hp = 12,
					spd = 3,
				},
				m = {
					def = 4,
					hp = 16,
					spd = 4,
				},
			},
			source = 'Rock Candy',
		},
	},
}