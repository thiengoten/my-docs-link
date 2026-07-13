export const sheetDialogClass =
  "fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-full max-h-[85vh] overflow-y-auto rounded-t-lg p-0 shadow-3 backdrop:bg-[rgba(22,35,61,0.4)] md:static md:m-auto md:max-w-md md:rounded-lg";

export function SheetHandle() {
  return (
    <div className="flex justify-center pt-3 md:hidden">
      <span aria-hidden className="h-1 w-8 rounded-full bg-line" />
    </div>
  );
}
