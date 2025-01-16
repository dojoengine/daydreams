export interface BaseIO {
  type: string;
}

// generic input type
export interface Input<TContent extends BaseIO> {
  name: string;
  content: TContent;
}

// generic output type
export interface Output<TInput extends BaseIO, TContent extends BaseIO> {
  input: Input<TInput>;
  content: TContent | null;
  error?: Error;
}

// Generic ProcessorFn type
export type ProcessorFn<TInput extends BaseIO, TOutput extends BaseIO> = (
  input: Input<TInput>,
) => Promise<Output<TInput, TOutput>>;

// Base Processor interface that works with any message type
export interface Processor<TInput extends BaseIO, TOutput extends BaseIO> {
  handle(
    input: Input<TInput>,
    next: ProcessorFn<TInput, TOutput>,
  ): Promise<Output<TInput, TOutput>>;
}

export class Core<TInput extends BaseIO, TOutput extends BaseIO> {
  private processors: Processor<TInput, TOutput>[] = [];

  public registerProcessor(processor: Processor<TInput, TOutput>) {
    this.processors.push(processor);
  }

  public async process(input: Input<TInput>): Promise<Output<TInput, TOutput>> {
    // Create the chain of processor functions
    const chain = this.processors.reduceRight(
      (
        next: ProcessorFn<TInput, TOutput>,
        processor: Processor<TInput, TOutput>,
      ) => {
        return (input: Input<TInput>) => processor.handle(input, next);
      },
      // final handler that creates the Output
      (input: Input<TInput>) =>
        Promise.resolve({ input, content: null }) as Promise<
          Output<TInput, TOutput>
        >,
    );

    return chain(input);
  }
}

export class FunctionalProcessor<TInput extends BaseIO, TOutput extends BaseIO>
  implements Processor<TInput, TOutput> {
  constructor(
    private fn: (
      input: Input<TInput>,
      next: ProcessorFn<TInput, TOutput>,
    ) => Promise<Output<TInput, TOutput>>,
  ) {}

  async handle(
    input: Input<TInput>,
    next: ProcessorFn<TInput, TOutput>,
  ): Promise<Output<TInput, TOutput>> {
    return this.fn(input, next);
  }
}

// specialized processor that only handles specific message types
// abstract class SpecializedProcessor<
//   THandleInput extends BaseIO,
//   TInput extends BaseIO,
//   TOutput extends BaseIO
// > implements Processor<TInput, TOutput> {

//   async handle(
//     input: Input<TInput>,
//     next: ProcessorFn<TInput, TOutput>
//   ): Promise<Output<TInput, TOutput>> {
//     // Check if this input is the type we handle
//     if (this.canHandle(input.content)) {
//       return this.handleSpecific(
//         input as Input<THandleInput>,
//         next as ProcessorFn<THandleInput, TOutput>
//       );
//     }

//     // Pass through if we don't handle this type
//     return next(input);
//   }

//   protected abstract canHandle(content: TInput): content is THandleInput;

//   protected abstract handleSpecific(
//     input: Input<THandleInput>,
//     next: ProcessorFn<THandleInput, TOutput>
//   ): Promise<Output<TInput, TOutput>>;
// }
