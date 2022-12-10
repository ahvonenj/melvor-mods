export interface VMSpecialAttack {
    specialAttackName: AttackSelection["attack"]["name"],
    maxHit: number,
    canStun: boolean,
    canSleep: boolean,
    originalSpecialAttack: AttackSelection["attack"],
    effectiveMaxHit?: number,
}