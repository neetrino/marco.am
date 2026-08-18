import unittest

from openpyxl import Workbook

from scripts.convert_marco_xlsx_for_import import normalize_cell, select_filter_source_columns


class NormalizeCellTest(unittest.TestCase):
    def test_preserves_leading_zero_number_format(self) -> None:
        workbook = Workbook()
        cell = workbook.active["A1"]
        cell.value = 9468
        cell.number_format = "00000"

        self.assertEqual(normalize_cell(cell), "09468")

    def test_preserves_text_sku(self) -> None:
        workbook = Workbook()
        cell = workbook.active["A1"]
        cell.value = "09468"

        self.assertEqual(normalize_cell(cell), "09468")

    def test_preserves_positions_for_duplicate_attribute_headers(self) -> None:
        columns = select_filter_source_columns(
            ["ID", "Օգտակար ծավալ (լ)", "Օգտակար ծավալ (լ)"],
            {"ID"},
        )

        self.assertEqual(
            columns,
            [(1, "Օգտակար ծավալ (լ)"), (2, "Օգտակար ծավալ (լ)")],
        )


if __name__ == "__main__":
    unittest.main()
