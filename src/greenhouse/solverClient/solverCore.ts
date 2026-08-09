import { solveLocal } from "../solver";
import type { LocalSolveFn } from "./solverClient";

/**
 * The main thread's door to the solver core.
 *
 * One file, one job: be the only place on the main thread that names
 * `../solver`. `solverClient` reaches it with a dynamic import, so the core is
 * pulled into its own chunk and only ever downloaded by a browser that actually
 * takes the fallback path. Everywhere else the core arrives inside the worker
 * bundle instead, which is the whole point of having a worker.
 *
 * It also keeps the client testable. Because nothing statically imports this
 * module, a test can inject its own solve function and never resolve the core
 * at all.
 */
export const loadSolverCore = (): Promise<LocalSolveFn> => Promise.resolve(solveLocal);
