from riotgames_api import LeagueOfLegendsClientAPI
from rich import print as pprint
from enum import Enum
from dataclasses import dataclass

lolcapi = LeagueOfLegendsClientAPI()



class Queue(Enum):
    RANKED_FLEX_SR = "Ranked Flex"
    RANKED_SOLO_5x5 = "Ranked Solo/Duo"
    RANKED_TFT = "Ranked TFT"
    RANKED_TFT_DOUBLE_UP = "Ranked TFT Double Up"
    RANKED_TFT_PAIRS = "Ranked TFT (Double Up Beta)"  # Deprecated ?
    RANKED_TFT_TURBO = "Ranked TFT Hyper Roll"


class Division(Enum):
    IV = 4
    III = 3
    II = 2
    I = 1
    NA = 0


class TFTTier(Enum):
    NONE = ""
    GRAY = "Gray"
    GREEN = "Green"
    BLUE = "Blue"
    PURPLE = "Purple"
    HYPER = "Hyper"


class Tier(Enum):
    NA = ""
    ALL = "All"
    UNRANKED = "Unranked"
    IRON = "Iron"
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"
    EMERALD = "Emerald"
    DIAMOND = "Diamond"
    MASTER = "Master"
    GRANDMASTER = "Grandmaster"
    CHALLENGER = "Challenger"


@dataclass
class Stats:
    wins: int
    losses: int
    games: int
    winrate: float
    lp: int
    tier: Tier
    division: Division
    isProvisional: bool
    provisionalGameThreshold: int
    provisionalGamesRemaining: int
    highestTier: Tier
    highestDivision: Division
    previousSeasonAchievedDivision: Division
    previousSeasonAchievedTier: Tier
    previousSeasonEndDivision: Division
    previousSeasonEndTier: Tier
    ratedRating: int
    ratedTier: TFTTier
    miniSeriesProgress: str  # Figure out what this is
    warnings: str  # Figure out what this is
    queueType: Queue


def to_tier(tier: str) -> Tier:
    if tier == "":
        return Tier.NA
    return Tier[tier]


def get_stats(mode: Queue) -> Stats:
    stats = lolcapi.get("/lol-ranked/v1/current-ranked-stats")
    pprint(stats)
    selected_stats = stats.get("queueMap").get(mode.name)

    wins = selected_stats.get("wins")
    losses = selected_stats.get("losses")
    games = wins + losses

    if wins == 0:
        winrate = 0
    else:
        winrate = (wins / games) * 100

    return Stats(
        wins=selected_stats.get("wins"),
        losses=selected_stats.get("losses"),
        games=games,
        winrate=winrate,
        lp=selected_stats.get("leaguePoints"),
        tier=to_tier(selected_stats.get("tier")),
        division=Division[selected_stats.get("division")],
        isProvisional=selected_stats.get("isProvisional"),
        provisionalGameThreshold=selected_stats.get("provisionalGameThreshold"),
        provisionalGamesRemaining=selected_stats.get("provisionalGamesRemaining"),
        highestTier=to_tier(selected_stats.get("highestTier")),
        highestDivision=Division[selected_stats.get("highestDivision")],
        previousSeasonAchievedDivision=Division[selected_stats.get("previousSeasonAchievedDivision")],
        previousSeasonAchievedTier=to_tier(selected_stats.get("previousSeasonAchievedTier")),
        previousSeasonEndDivision=Division[selected_stats.get("previousSeasonEndDivision")],
        previousSeasonEndTier=to_tier(selected_stats.get("previousSeasonEndTier")),
        ratedRating=selected_stats.get("ratedRating"),
        ratedTier=TFTTier[selected_stats.get("ratedTier")],
        miniSeriesProgress=selected_stats.get("miniSeriesProgress"),
        warnings=selected_stats.get("warnings"),
        queueType=mode
    )


mode = Queue.RANKED_TFT_TURBO
stats = get_stats(mode)
pprint(stats)
print(mode.value)
provisional_indicator = f"[P {stats.provisionalGamesRemaining}/{stats.provisionalGameThreshold}] " if stats.isProvisional else ""
print(f"{provisional_indicator}{stats.tier.value} {stats.division.name}")
print(f"{stats.wins}W {stats.losses}L")
print(f"{stats.lp} LP")
print(f"{stats.games} Games")
print(f"{stats.winrate:.0f}% Winrate")

print(f"{stats.highestTier.value} {stats.highestDivision.name}")
print(f"{stats.previousSeasonAchievedTier.value} {stats.previousSeasonAchievedDivision.name}")
print(f"{stats.previousSeasonEndTier.value} {stats.previousSeasonEndDivision.name}")

# Hyper Roll
print(f"{stats.ratedTier.value} {stats.ratedRating} points")
