"""Build-time repair of author exports' reused input/output symbolic dimensions.
Weights and operators are untouched. Browser runtime stays entirely JavaScript.
"""
import sys
import onnx
p=sys.argv[1]
m=onnx.load(p)
for output in m.graph.output:
 dims=output.type.tensor_type.shape.dim
 for axis in [2,3]:
  dims[axis].ClearField('dim_value')
  dims[axis].dim_param='output_height' if axis==2 else 'output_width'
onnx.checker.check_model(m)
onnx.save(m,p)
