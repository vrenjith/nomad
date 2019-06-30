import { run } from '@ember/runloop';
import hbs from 'htmlbars-inline-precompile';
import { findAll, find } from 'ember-native-dom-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import { startMirage } from 'nomad-ui/initializers/ember-cli-mirage';
import { initialize as fragmentSerializerInitializer } from 'nomad-ui/initializers/fragment-serializer';

module('Integration | Component | job-page/parts/placement-failures', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    fragmentSerializerInitializer(this.owner);
    window.localStorage.clear();
    this.store = this.owner.lookup('service:store');
    this.server = startMirage();
    this.server.create('namespace');
  });

  hooks.afterEach(function() {
    this.server.shutdown();
    window.localStorage.clear();
  });

  test('when the job has placement failures, they are called out', function(assert) {
    this.server.create('job', { failedPlacements: true, createAllocations: false });
    this.store.findAll('job').then(jobs => {
      jobs.forEach(job => job.reload());
    });

    return settled().then(async () => {
      run(() => {
        this.set('job', this.store.peekAll('job').get('firstObject'));
      });

      await render(hbs`
        {{job-page/parts/placement-failures job=job}})
      `);

      return settled().then(() => {
        const failedEvaluation = this.get('job.evaluations')
          .filterBy('hasPlacementFailures')
          .sortBy('modifyIndex')
          .reverse()
          .get('firstObject');
        const failedTGAllocs = failedEvaluation.get('failedTGAllocs');

        assert.ok(find('[data-test-placement-failures]'), 'Placement failures section found');

        const taskGroupLabels = findAll('[data-test-placement-failure-task-group]').map(title =>
          title.textContent.trim()
        );

        failedTGAllocs.forEach(alloc => {
          const name = alloc.get('name');
          assert.ok(
            taskGroupLabels.find(label => label.includes(name)),
            `${name} included in placement failures list`
          );
          assert.ok(
            taskGroupLabels.find(label => label.includes(alloc.get('coalescedFailures') + 1)),
            'The number of unplaced allocs = CoalescedFailures + 1'
          );
        });
      });
    });
  });

  test('when the job has no placement failures, the placement failures section is gone', function(assert) {
    this.server.create('job', { noFailedPlacements: true, createAllocations: false });
    this.store.findAll('job');

    return settled().then(async () => {
      run(() => {
        this.set('job', this.store.peekAll('job').get('firstObject'));
      });

      await render(hbs`
        {{job-page/parts/placement-failures job=job}})
      `);

      return settled().then(() => {
        assert.notOk(
          find('[data-test-placement-failures]'),
          'Placement failures section not found'
        );
      });
    });
  });
});
