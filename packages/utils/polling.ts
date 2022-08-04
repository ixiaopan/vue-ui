export type CancelFunction = () => void

export type Executor = (cancel?: CancelFunction) => Promise<any>

export default class Polling {
  private executor: Executor
  private interval: number
  private timeout: number
  private timerId: any

  // pending, running, canceled
  private state = 'pending'
  private startTime = 0

  constructor(executor: Executor, interval = 1000, timeout = 8 * 1000) {
    this.executor = executor
    this.interval = interval
    this.timeout = timeout
    this.state = 'pending'
  }

  start(): CancelFunction {
    if (this.state == 'running') {
      console.log('Already running')
      return this.cancel
    }

    if (this.state == 'canceled') {
      console.log('Already canceled')
      return this.cancel
    }

    this.startTime = Date.now()
    this.state = 'running'
    this._run()

    return this.cancel
  }

  cancel = () => {
    if (this.state != 'running') {
      return
    }

    this.state = 'canceled'
    clearTimeout(this.timerId)
  }

  private _run = () => {
    this.executor(this.cancel).finally(this._step)
  }

  private _step = () => {
    if (this.state != 'running') {
      return
    }

    if (Date.now() - this.startTime > this.timeout) {
      return this.cancel()
    }

    this.timerId = setTimeout(this._run, this.interval)
  }
}

export function startPolling(executor: Executor, interval: number, timeout: number): CancelFunction {
  return new Polling(executor, interval, timeout).start()
}
