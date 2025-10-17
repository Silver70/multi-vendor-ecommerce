using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/InventoryLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryLog>>> GetInventoryLogs()
        {
            return await _context.InventoryLogs.ToListAsync();
        }

        // GET: api/InventoryLogs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryLog>> GetInventoryLog(Guid id)
        {
            var inventoryLog = await _context.InventoryLogs.FindAsync(id);

            if (inventoryLog == null)
            {
                return NotFound();
            }

            return inventoryLog;
        }

        // PUT: api/InventoryLogs/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutInventoryLog(Guid id, InventoryLog inventoryLog)
        {
            if (id != inventoryLog.Id)
            {
                return BadRequest();
            }

            _context.Entry(inventoryLog).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InventoryLogExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/InventoryLogs
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<InventoryLog>> PostInventoryLog(InventoryLog inventoryLog)
        {
            _context.InventoryLogs.Add(inventoryLog);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetInventoryLog", new { id = inventoryLog.Id }, inventoryLog);
        }

        // DELETE: api/InventoryLogs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventoryLog(Guid id)
        {
            var inventoryLog = await _context.InventoryLogs.FindAsync(id);
            if (inventoryLog == null)
            {
                return NotFound();
            }

            _context.InventoryLogs.Remove(inventoryLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool InventoryLogExists(Guid id)
        {
            return _context.InventoryLogs.Any(e => e.Id == id);
        }
    }
}
