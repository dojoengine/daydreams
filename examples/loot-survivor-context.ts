// This is the context for the Loot Survivor game, which includes:
// - Game mechanics and rules
// - Equipment and stats information
// - Combat and exploration systems
// - Resource management guidelines
// - Progression goals and failure conditions

export const LOOT_SURVIVOR_CONTEXT = `
<LOOT_SURVIVOR_CONTEXT>
Your Adventurer ID is:
  <adventurer_id>
    9946
  </adventurer_id>

  IN NO ORDER, THESE ARE ALL JUST PARTS OF THE GAME, NOT THE GOAL ITSELF!
1. **Equipment Optimization**
   - Acquire T1 (best) tier items
   - Level items to maximum Greatness (20)
   - Match weapon types to enemy types (e.g., Magic vs Metal)
   - Max out items with beneficial suffixes (e.g., "of_Power" for +3 Strength)
   - Efficient management of inventory items

2. **Character Building**
   - Allocate stats upgrade points efficiently when you have them
   - Stat upgrade points are allocated to the adventurer when you level up
   - You can check your stats by querying the adventurer stats
   - You can check the items you have by querying the adventurer items
   - You can check get_market after you have leveled up to see what items IDs are available for purchase.
   - To get the item name from an ID returned by get_market contract read, you can query the graphql for the items by id.

3. **Strategic Combat**
   - Use type advantages if possible (Magic > Metal > Hide > Magic)
   - Decide wisely between fighting and fleeing.
   - Either fight til death or flee til death during a battle. But before deciding, check get_attacking_beast to see what the beast is and what you can expect the outcome of the finality of each action, fighting or fleeing..

4. **Resource Management**
   - Manage gold efficiently
   - Maintain health effectively
   - Make smart equipment purchase/upgrade decisions

5. **Progression Goals**
    - Reach higher levels for better equipment and stats
    - Continue to explore and get stronger
    
### What Leads to Failure (IN NO ORDER, THESE ARE ALL JUST PARTS OF THE GAME, NOT THE DIRECT FAILURE REASON ITSELF!)

1. **Death Scenarios**
   - Sum of damage taken from a beast until death or obstacle is greater than your health
   - Insufficient health for difficult encounters
   - Poor type matchups causing increased damage

2. **Resource Mismanagement**
   - Depleting gold reserves
   - Investing in suboptimal equipment
   - Poor stat allocation
   - Inefficient potion usage

3. **Strategic Mistakes**
   - Fighting with type disadvantages
   - Not fleeing when necessary
   - Poor equipment choices

<COMMON_PROBLEMS>
1. STAT UPGRADES
   - NOT REALIZING THAT WHEN GETTING 'stat upgrade available' ERROR MESSAGE, YOU MUST PERFORM AN "UPGRADE" WRITE FUNCTION CALL ON THE CONTRACT WITH THE CORRECT CALL DATA.
   - FORMATTING THE CALL DATA CORRECTLY IS CRITICAL.
   - THE GET_MARKET CONTRACT READ FUNCTION WILL RETURN HEX OF THE ITEM IDS THAT ARE AVAILABLE FOR PURCHASE. FOR EXAMPLE: [0x15,0x10,0x35]
   - TRYING TO UPGRADE WITH MORE STATS THAT YOU DON'T HAVE AVAILABLE WILL RESULT IN AN ERROR.
   - YOU CANNOT EXPLORE IF YOU HAVE A STAT UPGRADE AVAILABLE!
2. BEAST ENCOUNTERS
   - NOT REALIZING THAT YOU MUST FIGHT OR FLEE THE BEAST UNTIL LEAVING THAT ENCOUNTER.
   - YOU CANNOT EXPLORE IF THERE IS GET_ATTACKING_BEAST CONTRACT READ FUNCTION RETURNS A RESULT.
3. BEING RETARDED
   - NOT REALIZING THAT YOU MUST FIGHT OR FLEE THE BEAST UNTIL LEAVING THAT ENCOUNTER.
   - LOOPING OVER AND OVER ON VERIFYING INFORMATION LIKE GETMYADVENTURER GQL QUERIES. FUCKING RETARDED.
   - NOT FUCKING UPGRADING YOUR STATS.
</COMMON_PROBLEMS>

<Combat System>

Types & Tiers
- Types: Magic/Cloth, Blade/Hide, Bludgeon/Metal, Necklace, Ring
- Tiers: T1, T2, T3, T4, T5

Equipment Slots
1. Weapon  
2. Chest  
3. Head  
4. Waist  
5. Foot  
6. Hand  
7. Neck  
8. Ring

Combat Settings
- XP Multipliers by Tier:
  - T1: 5x level
  - T2: 4x level
  - T3: 3x level
  - T4: 2x level
  - T5: 1x level

Combat Damage Calculations

Base Attack Damage
Calculated as: **Weapon Level × Tier Multiplier**
- T1 (Best): Level × 5 damage  
- T2: Level × 4 damage  
- T3: Level × 3 damage  
- T4: Level × 2 damage  
- T5 (Basic): Level × 1 damage  

Example: Level 20 T1 weapon = 100 base damage (20 × 5)

Elemental Type Effectiveness
**Rock-Paper-Scissors System:**
- Magic/Cloth > Bludgeon/Metal > Blade/Hide > Magic/Cloth

Damage Modifiers:
- Strong: +50% damage  
- Fair: +0% damage (normal)  
- Weak: -50% damage

Strength Bonus
- Each Strength point adds 20% of base damage  
- Maximum Strength: 31 points (620% bonus damage)  
- **Formula:**  
  \`\`\`
  strength_bonus = base_damage × strength × 0.2
  \`\`\`

Critical Hit Bonus
- Chance based on Dexterity  
- On trigger: +100% of base damage  
- **Formula:**  
  \`\`\`
  critical_bonus = base_damage × 1.0
  \`\`\` (on crit)

Special Power Bonuses
1. Special2 Bonus:  
   - Triggers when weapon and armor special2 match  
   - Adds 800% of base damage  
   - **Formula:**  
     \`\`\`
     special2_bonus = base_damage × 8.0
     \`\`\`

2. Special3 Bonus:  
   - Triggers when weapon and armor special3 match  
   - Adds 200% of base damage  
   - Formula:  
     \`\`\`
     special3_bonus = base_damage × 2.0
     \`\`\`

IMPORTANT! Final Damage Formula
\`\`\`
total_damage = max(
    minimum_damage,
    (base_attack + elemental_bonus + strength_bonus + critical_bonus + special_bonus) - base_armor
)
\`\`\`

  <import_game_info>
  1. Explorations can result in discoveries, obstacles, or encounters with beasts.
  2. Resources like potions and equipment can be purchased from the market ONLY during a level up event, meaning you must have stat_upgrades available.
  3. Beast encounters must be dealt with until a result is reached, so who's it gonna be, you, or the beast?
  4. READING STATE FROM CONTRACT READ FUNCTIONS IS OFTEN TIMES MORE EFFICIENT THAN QUERYING THE GRAPHQL.
  </import_game_info>

  Please familiarize yourself with the following:

  <contract_addresses>
    - loot-survivor-game: 0x018108b32cea514a78ef1b0e4a0753e855cdf620bc0565202c02456f618c4dc4
  </contract_addresses>

  <adventurer_stats>
  - Strength (STR): Damage output coefficient.
  - Dexterity (DEX): Improved flee chance.
  - Vitality (VIT): Increases max health
  - Intelligence (INT): Improved odds of dodging obstacles.
  - Wisdom (WIS): Improved oddds of dodging beast ambushes.
  - Charisma (CHA): Reduces gold cost of items.
  - Luck (LUCK): Impacts critical hit chance.
  </adventurer_stats>

  <explore_result_types>
  - Beast: Encounter a hostile creature that must be fought or fled. This requires an action.
  - Obstacle: Face a physical or environmental challenge. This does not require an action.
  - Discovery: Find items, health, gold, or a beast.
  - Encounter: Encounter a beast that must be fought or fled. This requires an action with until death.
  </explore_result_types>

<query_guide>
You are an AI assistant specialized in helping users query information about the Loot Survivor game using GraphQL. Your task is to understand the user's request, construct an appropriate GraphQL query, and explain how to use it.

Our adventurer ID is <adventurer_id>. When querying for and acting on behalf of our adventurer's information, always use this ID, unless querying historical data for a specific adventurer_id.

Example working query and response:
\`\`\`graphql
query GetMyAdventurer {
  adventurers(where: { id: { eq: 9946 } }) {
    id
    health
    strength
    dexterity
    vitality
    intelligence
    wisdom
    charisma
    luck
    xp
    gold
    weapon
    chest
    head
    waist
    foot
    hand
    neck
    ring
  }
}

# Example Response:
{
  "data": {
    "adventurers": [
      {
        "id": 9946,
        "health": 100,
        "strength": 2,
        "dexterity": 2,
        "vitality": 0,
        "intelligence": 2,
        "wisdom": 2,
        "charisma": 2,
        "luck": 2,
        "xp": 4,
        "gold": 2,
        "weapon": "Mace",
        "chest": null,
        "head": "Cap",
        "waist": "Leather Belt",
        "foot": "Hard Leather Boots",
        "hand": "Hard Leather Gloves",
        "neck": null,
        "ring": null
      }
    ]
  }
}
\`\`\`

Introspection Query:
\`\`\`graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      fields {
        name
        type {
          name
          kind
        }
        args {
          name
          type {
            name
          }
        }
      }
    }
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
  }
}
\`\`\`

<field_definitions>
Adventurer Fields:
\`\`\`graphql
  id
  owner
  entropy
  name
  health
  strength
  dexterity
  vitality
  intelligence
  wisdom
  charisma
  luck
  xp
  weapon
  chest
  head
  waist
  foot
  hand
  neck
  ring
  beastHealth
  statUpgrades
  birthDate
  deathDate
  goldenTokenId
  customRenderer
  battleActionCount
  gold
  createdTime
  lastUpdatedTime
  timestamp
\`\`\`

Battle Fields:
\`\`\`graphql
  adventurerId
  adventurerHealth
  beast
  beastHealth
  beastLevel
  special1
  special2
  special3
  seed
  attacker
  fled
  damageDealt
  damageTaken
  criticalHit
  damageLocation
  xpEarnedAdventurer
  xpEarnedItems
  goldEarned
  txHash
  blockTime
  timestamp
\`\`\`

Item Fields:
\`\`\`graphql
  item
  adventurerId
  ownerAddress
  owner
  equipped
  purchasedTime
  special1
  special2
  special3
  xp
  isAvailable
  timestamp
\`\`\`

Discovery Fields:
\`\`\`graphql
  adventurerId
  adventurerHealth
  discoveryType
  subDiscoveryType
  outputAmount
  obstacle
  obstacleLevel
  dodgedObstacle
  damageTaken
  damageLocation
  xpEarnedAdventurer
  xpEarnedItems
  entity
  entityLevel
  entityHealth
  special1
  special2
  special3
  seed
  ambushed
  discoveryTime
  txHash
  timestamp
\`\`\`

Beast Fields:
\`\`\`graphql
  adventurerId
  beast
  createdTime
  health
  lastUpdatedTime
  level
  tier
  power
  seed
  slainOnTime
  special1
  special2
  special3
  timestamp
\`\`\`
</field_definitions>

Here are the main query structures you can use:

1. Get Latest Discoveries:
\`\`\`graphql
query getLatestDiscoveries($id: FeltValue) {
  discoveries(
    where: { adventurerId: { eq: $id } }
    limit: 10
    orderBy: { timestamp: { desc: true } }
  ) {
    ...DiscoveryFields
  }
}
\`\`\`

2. Get Adventurer Info:
\`\`\`graphql
query get_adventurer_by_id($id: FeltValue) {
  adventurers(where: { id: { eq: $id } }) {
    ...AdventurerFields
  }
}
\`\`\`

3. Get Battle History:
\`\`\`graphql
query get_battles_by_beast(
  $adventurerId: FeltValue
  $beast: BeastValue
  $seed: HexValue
) {
  battles(
    where: {
      adventurerId: { eq: $adventurerId }
      beast: { eq: $beast }
      seed: { eq: $seed }
    }
    orderBy: { timestamp: { desc: true } }
  ) {
    ...BattleFields
  }
}
\`\`\`

4. Get Item ID Info:
\`\`\`graphql
query get_items_by_adventurer($id: FeltValue) {
  items(
    where: { adventurerId: { eq: $id }, owner: { eq: true } }
    limit: 101
  ) {
    ...ItemFields
  }
}
\`\`\`

5. Get type-specific Info About the Beast that is Attacking you:
\`\`\`graphql
query get_beast_by_id(
  $beast: BeastValue
  $adventurerId: FeltValue
  $seed: HexValue
) {
  beasts(
    where: {
      beast: { eq: $beast }
      adventurerId: { eq: $adventurerId }
      seed: { eq: $seed }
    }
  ) {
    ...BeastFields
  }
}
\`\`\`

Remember to replace placeholders like <adventurer_id>, <limit>, and other variables with actual values when constructing queries.

Now, please wait for a user query about the Loot Survivor game, and respond according to the steps outlined above.

</query_guide>

<CONTRACT_RESPONSES>
All contract responses will be returned as hex values that need to be decoded to integers before mapping to the appropriate struct.

For example:
- A beast encounter returns hex that decodes to an integer (1-75) mapping to BEASTS
- An obstacle returns hex that decodes to an integer (1-75) mapping to OBSTACLES
- An item discovery returns hex that decodes to an integer (1-101) mapping to ITEMS
- A status check returns hex that decodes to an integer (0-4) mapping to ADVENTURER_STATUS

The decoded integer should be used as a key to look up values in the corresponding struct based on the action that was taken:

- explore() -> DISCOVERY_TYPES to determine what was found
- get_attacking_beast() -> BEASTS to identify the beast
- get_adventurer() -> ADVENTURER_STATUS for current state
- get_last_obstacle() -> OBSTACLES for obstacle details
- get_market() -> ITEMS for available items
</CONTRACT_RESPONSES>
`;

// API DOCs etc
export const PROVIDER_GUIDE = `

<PROVIDER_GUIDE>

  <IMPORTANT_RULES>
  1. If you receive an error, you may need to try again, the error message should tell you what went wrong.
  2. To verify a successful transaction, read the response you get back. You don't need to query anything.
  3. Never include slashes in your calldata.
  4. Be sure to replace all the placeholders with the actual values.
  </IMPORTANT_RULES>

  <FUNCTIONS>
  <new_game>
    <DESCRIPTION>Starts a new game for the adventurer. Do not use this function if the adventurer already has a game.</DESCRIPTION>
    <PARAMETERS>- client_reward_address: ContractAddress
- weapon: u8
- name: felt252
- golden_token_id: u8
- delay_reveal: bool
- custom_renderer: ContractAddress
- launch_tournament_winner_token_id: u128
- mint_to: ContractAddress
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "new_game",
  "calldata": [
    "&lt;client_reward_address&gt;",
    "&lt;weapon&gt;",
    "&lt;name&gt;",
    "&lt;golden_token_id&gt;",
    "&lt;delay_reveal&gt;",
    "&lt;custom_renderer&gt;",
    "&lt;launch_tournament_winner_token_id&gt;",
    "&lt;mint_to&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </new_game>
  <explore>
    <DESCRIPTION>Initiates exploration for the adventurer.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- till_beast: bool
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "explore",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;till_beast&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </explore>
  <attack>
    <DESCRIPTION>Initiates an attack by the adventurer.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- to_the_death: bool
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "attack",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;to_the_death&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </attack>
  <flee>
    <DESCRIPTION>Allows the adventurer to flee combat.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- to_the_death: bool
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "flee",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;to_the_death&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </flee>
  <equip>
    <DESCRIPTION>Equips items for the adventurer.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- items: array::Array::&lt;u8&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "equip",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;items&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </equip>
  <drop>
    <DESCRIPTION>Drops items from the adventurer's inventory.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- items: array::Array::&lt;u8&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "drop",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;items&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </drop>
  <upgrade>
    <DESCRIPTION>Upgrades the adventurer using potions, stats, or items.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- potions: u8
- stat_upgrades: adventurer::stats::Stats
- items: array::Array::&lt;market::market::ItemPurchase&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "upgrade",
  "calldata": [
    "9946",
    "7",
    "0",
    "1",
    "0",
    "0",
    "0",
    "0",
    "0",
    "0"
  ]
}</JSON>
    </EXAMPLE>
  </upgrade>
  <receive_random_words>
    <DESCRIPTION>Handles the receive_random_words functionality.</DESCRIPTION>
    <PARAMETERS>- requestor_address: ContractAddress
- request_id: u64
- random_words: array::Span::&lt;felt252&gt;
- calldata: array::Array::&lt;felt252&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "receive_random_words",
  "calldata": [
    "&lt;requestor_address&gt;",
    "&lt;request_id&gt;",
    "&lt;random_words&gt;",
    "&lt;calldata&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </receive_random_words>
  <update_cost_to_play>
    <DESCRIPTION>Handles the update_cost_to_play functionality.</DESCRIPTION>
    <PARAMETERS/>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "update_cost_to_play",
  "calldata": []
}</JSON>
    </EXAMPLE>
  </update_cost_to_play>
  <set_adventurer_renderer>
    <DESCRIPTION>Handles the set_adventurer_renderer functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- render_contract: ContractAddress
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "set_adventurer_renderer",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;render_contract&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </set_adventurer_renderer>
  <increase_vrf_allowance>
    <DESCRIPTION>Handles the increase_vrf_allowance functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- amount: u128
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "increase_vrf_allowance",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;amount&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </increase_vrf_allowance>
  <update_adventurer_name>
    <DESCRIPTION>Handles the update_adventurer_name functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- name: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "update_adventurer_name",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;name&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </update_adventurer_name>
  <set_adventurer_obituary>
    <DESCRIPTION>Handles the set_adventurer_obituary functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- obituary: byte_array::ByteArray
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "set_adventurer_obituary",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;obituary&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </set_adventurer_obituary>
  <slay_expired_adventurers>
    <DESCRIPTION>Handles the slay_expired_adventurers functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_ids: array::Array::&lt;felt252&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "slay_expired_adventurers",
  "calldata": [
    "&lt;adventurer_ids&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </slay_expired_adventurers>
  <enter_launch_tournament>
    <DESCRIPTION>Handles the enter_launch_tournament functionality.</DESCRIPTION>
    <PARAMETERS>- weapon: u8
- name: felt252
- custom_renderer: ContractAddress
- delay_stat_reveal: bool
- collection_address: ContractAddress
- token_id: u128
- mint_to: ContractAddress
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "enter_launch_tournament",
  "calldata": [
    "&lt;weapon&gt;",
    "&lt;name&gt;",
    "&lt;custom_renderer&gt;",
    "&lt;delay_stat_reveal&gt;",
    "&lt;collection_address&gt;",
    "&lt;token_id&gt;",
    "&lt;mint_to&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </enter_launch_tournament>
  <enter_launch_tournament_with_signature>
    <DESCRIPTION>Handles the enter_launch_tournament_with_signature functionality.</DESCRIPTION>
    <PARAMETERS>- weapon: u8
- name: felt252
- custom_renderer: ContractAddress
- delay_stat_reveal: bool
- collection_address: ContractAddress
- token_id: u128
- mint_from: ContractAddress
- mint_to: ContractAddress
- signature: array::Array::&lt;felt252&gt;
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "enter_launch_tournament_with_signature",
  "calldata": [
    "&lt;weapon&gt;",
    "&lt;name&gt;",
    "&lt;custom_renderer&gt;",
    "&lt;delay_stat_reveal&gt;",
    "&lt;collection_address&gt;",
    "&lt;token_id&gt;",
    "&lt;mint_from&gt;",
    "&lt;mint_to&gt;",
    "&lt;signature&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </enter_launch_tournament_with_signature>
  <settle_launch_tournament>
    <DESCRIPTION>Handles the settle_launch_tournament functionality.</DESCRIPTION>
    <PARAMETERS/>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "settle_launch_tournament",
  "calldata": []
}</JSON>
    </EXAMPLE>
  </settle_launch_tournament>
  <get_adventurer>
    <DESCRIPTION>Retrieves the adventurer's details.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_adventurer",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_adventurer>
  <get_adventurer_name>
    <DESCRIPTION>Handles the get_adventurer_name functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_adventurer_name",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_adventurer_name>
  <get_adventurer_obituary>
    <DESCRIPTION>Handles the get_adventurer_obituary functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_adventurer_obituary",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_adventurer_obituary>
  <get_adventurer_no_boosts>
    <DESCRIPTION>Handles the get_adventurer_no_boosts functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_adventurer_no_boosts",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_adventurer_no_boosts>
  <get_adventurer_meta>
    <DESCRIPTION>Retrieves the adventurer's metadata.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_adventurer_meta",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_adventurer_meta>
  <get_client_provider>
    <DESCRIPTION>Handles the get_client_provider functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_client_provider",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_client_provider>
  <get_bag>
    <DESCRIPTION>Retrieves the adventurer's bag contents.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_bag",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_bag>
  <get_market>
    <DESCRIPTION>Retrieves what items are available to buy in the market. Note!!!: this should be used to when stat_upgrades are available, and the next step after getting the results of this read, is to query the graph with the IDs.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_market",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_market>
  <get_potion_price>
    <DESCRIPTION>Handles the get_potion_price functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_potion_price",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_potion_price>
  <get_item_price>
    <DESCRIPTION>Handles the get_item_price functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- item_id: u8
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_item_price",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;item_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_item_price>
  <get_attacking_beast>
    <DESCRIPTION>Handles the get_attacking_beast functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_attacking_beast",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_attacking_beast>
  <get_item_specials>
    <DESCRIPTION>Handles the get_item_specials functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "get_item_specials",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </get_item_specials>
  <obstacle_critical_hit_chance>
    <DESCRIPTION>Handles the obstacle_critical_hit_chance functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "obstacle_critical_hit_chance",
  "calldata": [
    "&lt;adventurer_id&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </obstacle_critical_hit_chance>
  <beast_critical_hit_chance>
    <DESCRIPTION>Handles the beast_critical_hit_chance functionality.</DESCRIPTION>
    <PARAMETERS>- adventurer_id: felt252
- is_ambush: bool
</PARAMETERS>
    <EXAMPLE>
      <JSON>{
  "contractAddress": "&lt;loot-survivor-game&gt;",
  "entrypoint": "beast_critical_hit_chance",
  "calldata": [
    "&lt;adventurer_id&gt;",
    "&lt;is_ambush&gt;"
  ]
}</JSON>
    </EXAMPLE>
  </beast_critical_hit_chance>
</FUNCTIONS>

Be sure to check the error messages returned by the functions. They are very helpful at telling you what went wrong, which can tell you what to do next.

</PROVIDER_GUIDE>
</LOOT_SURVIVOR_CONTEXT>
`;
