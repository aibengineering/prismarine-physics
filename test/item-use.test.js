/* eslint-env mocha */

const { Physics, PlayerState } = require('prismarine-physics')
const { Vec3 } = require('vec3')
const expect = require('expect')

const mcData = require('minecraft-data')('1.13.2')
const Block = require('prismarine-block')('1.13.2')

const fakeWorld = {
  getBlock: (pos) => {
    const type = (pos.y < 60) ? mcData.blocksByName.stone.id : mcData.blocksByName.air.id
    const b = new Block(type, 0, 0)
    b.position = pos
    return b
  }
}

function fakePlayer ({ usingHeldItem = false, vehicle = null } = {}) {
  return {
    entity: {
      position: new Vec3(0.5, 60, 0.5),
      velocity: new Vec3(0, 0, 0),
      onGround: true,
      isInWater: false,
      isInLava: false,
      isInWeb: false,
      isCollidedHorizontally: false,
      isCollidedVertically: false,
      elytraFlying: false,
      yaw: 0,
      pitch: 0,
      effects: {}
    },
    usingHeldItem,
    vehicle,
    jumpTicks: 0,
    jumpQueued: false,
    fireworkRocketDuration: 0,
    version: '1.13.2',
    inventory: { slots: [] }
  }
}

// Blocks per second once walking or sprinting has reached its steady speed.
function steadySpeed ({ itemUseSlowdown, usingHeldItem, sprint = false, vehicle = null }) {
  const physics = Physics(mcData, fakeWorld)
  physics.itemUseSlowdown = itemUseSlowdown
  const player = fakePlayer({ usingHeldItem, vehicle })
  const controls = { forward: true, back: false, left: false, right: false, jump: false, sprint, sneak: false }
  for (let tick = 0; tick < 40; tick++) physics.simulatePlayer(new PlayerState(player, controls), fakeWorld).apply(player)
  const start = player.entity.position.clone()
  for (let tick = 0; tick < 20; tick++) physics.simulatePlayer(new PlayerState(player, controls), fakeWorld).apply(player)
  return player.entity.position.distanceTo(start)
}

describe('Item use movement', () => {
  it('leaves movement unchanged by default', () => {
    expect(steadySpeed({ itemUseSlowdown: false, usingHeldItem: true })).toBeCloseTo(4.317, 2)
    expect(steadySpeed({ itemUseSlowdown: false, usingHeldItem: true, sprint: true })).toBeCloseTo(5.612, 2)
  })

  it('walks at a fifth of walking speed while an item is in use', () => {
    expect(steadySpeed({ itemUseSlowdown: true, usingHeldItem: false })).toBeCloseTo(4.317, 2)
    expect(steadySpeed({ itemUseSlowdown: true, usingHeldItem: true })).toBeCloseTo(0.863, 2)
  })

  it('does not sprint while an item is in use', () => {
    expect(steadySpeed({ itemUseSlowdown: true, usingHeldItem: true, sprint: true })).toBeCloseTo(0.863, 2)
    expect(steadySpeed({ itemUseSlowdown: true, usingHeldItem: false, sprint: true })).toBeCloseTo(5.612, 2)
  })

  it('ignores item use while riding', () => {
    expect(steadySpeed({ itemUseSlowdown: true, usingHeldItem: true, vehicle: {} })).toBeCloseTo(4.317, 2)
  })
})
