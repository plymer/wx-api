export const FEET_PER_METRE = 3.28084;

export function leadZero(input: number): string {
  const inputString: string = input.toString();
  let output: string;
  inputString.length < 2 ? (output = "0" + inputString) : (output = inputString);
  return output;
}
