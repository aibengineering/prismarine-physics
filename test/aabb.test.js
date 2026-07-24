/* eslint-env mocha */

const assert = require('assert')
const AABB = require('../lib/aabb')

const axes = [
  { name: 'X', index: 0, method: 'computeOffsetX' },
  { name: 'Y', index: 1, method: 'computeOffsetY' },
  { name: 'Z', index: 2, method: 'computeOffsetZ' }
]

const requestedMotion = 0.25
const subEpsilonOverlap = 5e-8
const realOverlap = 2e-7
const realGap = 0.125

function movingBox (axisIndex, side, separation) {
  const min = [0.25, 0.25, 0.25]
  const max = [0.75, 0.75, 0.75]

  if (side === 'negative') {
    max[axisIndex] = -separation
    min[axisIndex] = max[axisIndex] - 1
  } else {
    min[axisIndex] = 1 + separation
    max[axisIndex] = min[axisIndex] + 1
  }

  return new AABB(...min, ...max)
}

describe('AABB collision offsets', () => {
  const block = new AABB(0, 0, 0, 1, 1, 1)

  for (const axis of axes) {
    describe(axis.name, () => {
      it('clamps exact and sub-epsilon contact from both directions', () => {
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'negative', 0), requestedMotion), 0)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'positive', 0), -requestedMotion), 0)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'negative', -subEpsilonOverlap), requestedMotion), 0)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'positive', -subEpsilonOverlap), -requestedMotion), 0)
      })

      it('preserves real gaps', () => {
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'negative', realGap), requestedMotion), realGap)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'positive', realGap), -requestedMotion), -realGap)
      })

      it('does not treat overlap beyond the epsilon as contact', () => {
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'negative', -realOverlap), requestedMotion), requestedMotion)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'positive', -realOverlap), -requestedMotion), -requestedMotion)
      })

      it('does not restrict movement away from contact', () => {
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'negative', 0), -requestedMotion), -requestedMotion)
        assert.strictEqual(block[axis.method](movingBox(axis.index, 'positive', 0), requestedMotion), requestedMotion)
      })
    })
  }

  it('clamps the reconstructed westbound switchback contact', () => {
    const riser = new AABB(3, 279, 485, 4, 280, 486)
    const player = new AABB(
      3.9999999999999996,
      279.42,
      485.38,
      4.600999999999999,
      281.22,
      485.981
    )

    assert.strictEqual(riser.computeOffsetX(player, -0.022615), 0)
  })
})
