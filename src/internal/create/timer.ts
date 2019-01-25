import { SchedulerLike } from 'rxjs/internal/types';
import { Subscriber } from 'rxjs/internal/Subscriber';
import { Subscription } from 'rxjs/internal/Subscription';
import { asyncScheduler } from 'rxjs/internal/scheduler/asyncScheduler';
import { Observable } from 'rxjs/internal/Observable';
import { isNumeric } from 'rxjs/internal/util/isNumeric';
import { isScheduler } from 'rxjs/internal/util/isScheduler';

export function timer(): Observable<number>;
export function timer(delay: number|Date): Observable<number>;
export function timer(delay: number|Date, scheduler: SchedulerLike): Observable<number>;
export function timer(delay: number|Date, interval: number): Observable<number>;
export function timer(delay: number|Date, interval: number, scheduler: SchedulerLike): Observable<number>;

/**
 * Creates an Observable that starts emitting after an `dueTime` and
 * emits ever increasing numbers after each `period` of time thereafter.
 *
 * <span class="informal">Its like {@link index/interval}, but you can specify when
 * should the emissions start.</span>
 *
 * ![](timer.png)
 *
 * `timer` returns an Observable that emits an infinite sequence of ascending
 * integers, with a constant interval of time, `period` of your choosing
 * between those emissions. The first emission happens after the specified
 * `dueTime`. The initial delay may be a `Date`. By default, this
 * operator uses the {@link asyncScheduler} {@link SchedulerLike} to provide a notion of time, but you
 * may pass any {@link SchedulerLike} to it. If `period` is not specified, the output
 * Observable emits only one value, `0`. Otherwise, it emits an infinite
 * sequence.
 *
 * ## Examples
 * ### Emits ascending numbers, one every second (1000ms), starting after 3 seconds
 * ```javascript
 * const numbers = timer(3000, 1000);
 * numbers.subscribe(x => console.log(x));
 * ```
 *
 * ### Emits one number after five seconds
 * ```javascript
 * const numbers = timer(5000);
 * numbers.subscribe(x => console.log(x));
 * ```
 * @see {@link index/interval}
 * @see {@link delay}
 *
 * @param {number|Date} [dueTime] The initial delay time specified as a Date object or as an integer denoting
 * milliseconds to wait before emitting the first value of 0`.
 * @param {number|SchedulerLike} [periodOrScheduler] The period of time between emissions of the
 * subsequent numbers.
 * @param {SchedulerLike} [scheduler=async] The {@link SchedulerLike} to use for scheduling
 * the emission of values, and providing a notion of "time".
 * @return {Observable} An Observable that emits a `0` after the
 * `dueTime` and ever increasing numbers after each `period` of time
 * thereafter.
 * @static true
 * @name timer
 * @owner Observable
 */
export function timer(dueTime: number | Date = 0,
                      periodOrScheduler?: number | SchedulerLike,
                      scheduler?: SchedulerLike): Observable<number> {

  let period = -1;
  if (isNumeric(periodOrScheduler)) {
    period = Number(periodOrScheduler) < 1 && 1 || Number(periodOrScheduler);
  } else if (isScheduler(periodOrScheduler)) {
    scheduler = periodOrScheduler as any;
  }

  if (!isScheduler(scheduler)) {
    scheduler = asyncScheduler;
  }

  return new Observable<number>(subscriber => {
    const due = isNumeric(dueTime)
      ? (dueTime as number)
      : (+dueTime - scheduler.now());
    const subscription = new Subscription();
    scheduler.schedule(timerDelayWork, due, { subscriber, scheduler, subscription, i: 0, period }, subscription);
    return subscription;
  });
}

function timerDelayWork(state: { subscriber: Subscriber<number>, scheduler: SchedulerLike, subscription: Subscription, i: number, period: number }) {
  const { subscriber, scheduler, subscription, period } = state;
  if (subscription.closed) { return; }
  subscriber.next(state.i++);
  if (!subscription.closed) {
    if (period >= 0) {
      scheduler.schedule(timerDelayWork as any, period, state, subscription);
    } else {
      subscriber.complete();
    }
  }
}