"use strict";

var WebGLBasic = {};

WebGLBasic.buildPipelineStates = function (gl, psos) {
    Object.keys(psos).forEach(function (psoName) {
        var pso;
        var vs, fs;
        var activeUniformIndex, activeUniform, uniformLocation;

        pso = psos[psoName];

        vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, pso.vs);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw "Error compiling vertex shader: " + gl.getShaderInfoLog(vs);
        }

        fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, pso.fs);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw "Error compiling fragment shader: " + gl.getShaderInfoLog(fs);
        }

        pso.program = gl.createProgram();
        gl.attachShader(pso.program, vs);
        gl.attachShader(pso.program, fs);
        gl.linkProgram(pso.program);
        if (!gl.getProgramParameter(pso.program, gl.LINK_STATUS)) {
            throw "Error linking program: " + gl.getProgramInfoLog(pso.program);
        }

        pso.uniforms = {};
        pso.samplers = {};
        activeUniformIndex = gl.getProgramParameter(pso.program, gl.ACTIVE_UNIFORMS) - 1;
        while (activeUniformIndex >= 0) {
            activeUniform = gl.getActiveUniform(pso.program, activeUniformIndex);
            uniformLocation = gl.getUniformLocation(pso.program, activeUniform.name);
            if (activeUniform.type === gl.SAMPLER_2D || activeUniform.type === gl.SAMPLER_CUBE) {
                pso.samplers[activeUniform.name] = {
                    name: activeUniform.name,
                    size: activeUniform.size,
                    type: activeUniform.type,
                    location: uniformLocation
                };
            } else {
                pso.uniforms[activeUniform.name] = {
                    name: activeUniform.name,
                    size: activeUniform.size,
                    type: activeUniform.type,
                    location: uniformLocation
                };
            }
            activeUniformIndex -= 1;
        }

        pso.rootParameterSlotToUniform = {};
        pso.rootParameterSlotToSampler = {};

    });
};

WebGLBasic.degToRad = function (deg) {
    return deg * Math.PI / 180.0;
};

WebGLBasic.makeIdentity4x4 = function () {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

WebGLBasic.makeTranslate4x4 = function (translateX, translateY, translateZ) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translateX, translateY, translateZ, 1
    ];
};

WebGLBasic.makeScale4x4 = function (scaleX, scaleY, scaleZ) {
    return [
        scaleX, 0, 0, 0,
        0, scaleY, 0, 0,
        0, 0, scaleZ, 0,
        0, 0, 0, 1
    ];
};

WebGLBasic.makeRotate3x3 = function (angle, axis) {
    var c, s;
    var axislen, axisnorm, x, y, z;

    c = Math.cos(angle);
    s = Math.sin(angle);

    axislen = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
    axisnorm = [axis[0] / axislen, axis[1] / axislen, axis[2] / axislen];
    x = axisnorm[0];
    y = axisnorm[1];
    z = axisnorm[2];

    return [
        x * x * (1 - c) + c, y * x * (1 - c) + z * s, x * z * (1 - c) - y * s,
        x * y * (1 - c) - z * s, y * y * (1 - c) + c, y * z * (1 - c) + x * s,
        x * z * (1 - c) + y * s, y * z * (1 - c) - x * s, z * z * (1 - c) + c
    ];
};

WebGLBasic.makeRotate4x4 = function (angle, axis) {
    var r3x3;

    r3x3 = WebGLBasic.makeRotate3x3(angle, axis);

    return [
        r3x3[0], r3x3[1], r3x3[2], 0,
        r3x3[3], r3x3[4], r3x3[5], 0,
        r3x3[6], r3x3[7], r3x3[8], 0,
        0, 0, 0, 1
    ];
};

WebGLBasic.multMat3Vec3 = function (m, v) {
    return [
        m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
        m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
        m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
    ];
};

WebGLBasic.makeLookAt = function (eye, center, up) {
    var f, flen, fnorm, uplen, upnorm, s, slen, snorm, u, tx, ty, tz;

    f = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]];
    flen = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
    fnorm = [f[0] / flen, f[1] / flen, f[2] / flen];

    uplen = Math.sqrt(up[0] * up[0] + up[1] * up[1] + up[2] * up[2]);

    upnorm = [up[0] / uplen, up[1] / uplen, up[2] / uplen];

    s = [
        fnorm[1] * upnorm[2] - upnorm[1] * fnorm[2],
        fnorm[2] * upnorm[0] - upnorm[2] * fnorm[0],
        fnorm[0] * upnorm[1] - upnorm[0] * fnorm[1]
    ];

    slen = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
    snorm = [s[0] / slen, s[1] / slen, s[2] / slen];

    u = [
        snorm[1] * fnorm[2] - fnorm[1] * snorm[2],
        snorm[2] * fnorm[0] - fnorm[2] * snorm[0],
        snorm[0] * fnorm[1] - fnorm[0] * snorm[1]
    ];

    tx = -(eye[0] * s[0] + eye[1] * s[1] + eye[2] * s[2]);
    ty = -(eye[0] * u[0] + eye[1] * u[1] + eye[2] * u[2]);
    tz = +(eye[0] * fnorm[0] + eye[1] * fnorm[1] + eye[2] * fnorm[2]);

    return [
        s[0], u[0], -fnorm[0], 0,
        s[1], u[1], -fnorm[1], 0,
        s[2], u[2], -fnorm[2], 0,
        tx, ty, tz, 1
    ];
};

WebGLBasic.makePerspective = function (fovy, aspect, zNear, zFar) {
    var f;

    f = 1.0 / Math.tan(fovy / 2.0);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (zFar + zNear) / (zNear - zFar), -1,
        0, 0, (2 * zFar * zNear) / (zNear - zFar), 0
    ];
};

WebGLBasic.createInterpreter = function (gl) {
    var interpreter;

    interpreter = {};

    interpreter.interpret = function (command) {
        return interpreter[command[0]](command[1]);
    };

    interpreter.setFramebuffer = function (fbo) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    };

    interpreter.clearColor = function (color) {
        gl.clearColor(color[0], color[1], color[2], color[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    interpreter.clearDepth = function (depth) {
        gl.clearDepth(depth);
        gl.clear(gl.DEPTH_BUFFER_BIT);
    };

    interpreter.setPipelineState = function (pso) {
        gl.useProgram(pso.program);

        if (pso.inputLayout) {
            interpreter.attributeLocationsForInputSlot = {};
            interpreter.attributeLocationToAttribute = {};
            Object.keys(pso.inputLayout).forEach(function (semanticName) {
                var inputAttribute, inputAttributeLocation;

                inputAttribute = pso.inputLayout[semanticName];
                inputAttributeLocation = gl.getAttribLocation(pso.program, semanticName);
                if (inputAttributeLocation !== -1) {
                    if (!interpreter.attributeLocationsForInputSlot[inputAttribute.inputSlot]) {
                        interpreter.attributeLocationsForInputSlot[inputAttribute.inputSlot] = [];
                    }
                    interpreter.attributeLocationsForInputSlot[inputAttribute.inputSlot].push(inputAttributeLocation);
                    interpreter.attributeLocationToAttribute[inputAttributeLocation] = inputAttribute;
                }
            });
        }

        if (pso.rootSignature) {
            interpreter.rootParameterSlotToUniform = {};
            interpreter.rootParameterSlotToSampler = {};
            Object.keys(pso.rootSignature.rootParameters).forEach(function (rootParameterSlot) {
                var rootParameter, rootParameterName;
                var uniformInfo, samplerInfo;

                rootParameter = pso.rootSignature.rootParameters[rootParameterSlot];
                rootParameterName = rootParameter.semanticName;
                if (rootParameter.type === "uniform") {
                    uniformInfo = pso.uniforms[rootParameterName];
                    interpreter.rootParameterSlotToUniform[rootParameterSlot] = uniformInfo;
                } else if (rootParameter.type === "sampler") {
                    samplerInfo = pso.samplers[rootParameterName];
                    interpreter.rootParameterSlotToSampler[rootParameterSlot] = samplerInfo;
                }
            });
        }

        if (pso.depthStencilState) {
            if (pso.depthStencilState.depthEnable) {
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(pso.depthStencilState.depthFunc);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
        } else {
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.STENCIL_TEST);
        }
    };

    interpreter.setRootUniforms = function (rootUniforms) {
        Object.keys(rootUniforms).forEach(function (rootParameterSlot) {
            var uniformInfo, uniformLocation, uniformValue;

            uniformInfo = interpreter.rootParameterSlotToUniform[rootParameterSlot];
            uniformLocation = uniformInfo.location;
            uniformValue = rootUniforms[rootParameterSlot];
            switch (uniformInfo.type) {
            case gl.FLOAT_VEC4:
                gl.uniform4fv(uniformLocation, uniformValue);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(uniformLocation, false, uniformValue);
                break;
            default:
                throw "Unhandled uniform type: " + uniformInfo.type;
            }
        });
    };

    interpreter.setActiveTextures = function (activeTextures) {
        Object.keys(activeTextures).forEach(function (textureImageUnit) {
            var textureInfo;

            textureInfo = activeTextures[textureImageUnit];
            gl.activeTexture(gl["TEXTURE" + textureImageUnit]);
            gl.bindTexture(textureInfo.target, textureInfo.texture);
            gl.texParameteri(textureInfo.target, gl.TEXTURE_MIN_FILTER, textureInfo.sampler.minFilter);
            gl.texParameteri(textureInfo.target, gl.TEXTURE_MAG_FILTER, textureInfo.sampler.magFilter);
            gl.texParameteri(textureInfo.target, gl.TEXTURE_WRAP_S, textureInfo.sampler.wrapS);
            gl.texParameteri(textureInfo.target, gl.TEXTURE_WRAP_T, textureInfo.sampler.wrapT);
        });
    };

    interpreter.setRootSamplers = function (rootSamplers) {
        Object.keys(rootSamplers).forEach(function (rootSamplerSlot) {
            var samplerInfo, samplerLocation, samplerValue;

            samplerInfo = interpreter.rootParameterSlotToSampler[rootSamplerSlot];
            samplerLocation = samplerInfo.location;
            samplerValue = rootSamplers[rootSamplerSlot];
            gl.uniform1i(samplerLocation, samplerValue);
        });
    };

    interpreter.drawNodes = function (nodeList) {
        nodeList.forEach(function (node) {
            if (node.vertexBufferViews) {
                Object.keys(node.vertexBufferViews).forEach(function (slotIndex) {
                    var vbv;
                    var attributeLocations;

                    vbv = node.vertexBufferViews[slotIndex];
                    gl.bindBuffer(gl.ARRAY_BUFFER, vbv.buffer);

                    attributeLocations = interpreter.attributeLocationsForInputSlot[slotIndex];

                    attributeLocations.forEach(function (attributeLocation) {
                        var attribute;

                        attribute = interpreter.attributeLocationToAttribute[attributeLocation];

                        gl.vertexAttribPointer(
                            attributeLocation,
                            attribute.size,
                            attribute.type,
                            attribute.normalized,
                            attribute.stride,
                            attribute.offset
                        );

                        gl.enableVertexAttribArray(attributeLocation);
                    });
                });
            }

            if (node.indexBufferView) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.indexBufferView.buffer);
            }

            if (node.drawArgs) {
                gl.drawArrays(
                    node.drawArgs.primitiveTopology,
                    node.drawArgs.startVertexLocation,
                    node.drawArgs.vertexCountPerInstance
                );
            }

            if (node.drawIndexedArgs) {
                gl.drawElements(
                    node.drawIndexedArgs.primitiveTopology,
                    node.drawIndexedArgs.indexCountPerInstance,
                    node.indexBufferView.type,
                    node.indexBufferView.offset
                );
            }
        });
    };

    return interpreter;
};

WebGLBasic.interpretPasses = function (interpreter, passes) {
    passes.forEach(function (pass) {
        pass.commandList.forEach(function (cmd) {
            interpreter.interpret(cmd);
        });
    });
};